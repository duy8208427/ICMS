"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, TicketKind, TicketStatus } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";
import {
  INTERNAL_ROLES,
  canAct,
  canSeeTicket,
  committedPaymentStatuses,
  formatVnd,
  nextTicketCode,
  parseDay,
  parseMoney,
  requireDbUser,
  settlementDiff,
  sumAmounts,
} from "@/lib/helpers";

function fail(path: string, message: string): never {
  const join = path.includes("?") ? "&" : "?";
  redirect(`${path}${join}error=${encodeURIComponent(message)}`);
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/ncc");
}

async function saveFiles(formData: FormData, ticketId: string, userId: string, kind: string) {
  const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
  for (const file of files) {
    const filePath = await saveUpload(file, ticketId);
    if (!filePath) continue;
    await prisma.attachment.create({
      data: {
        ticketId,
        fileName: file.name,
        filePath,
        kind,
        uploadedById: userId,
      },
    });
  }
}

async function log(ticketId: string, userId: string, action: string, message: string) {
  await prisma.timelineEvent.create({
    data: { ticketId, userId, action, message },
  });
}

type SettlementLine = {
  content: string;
  spentOn: Date | null;
  amount: number;
  fileName: string | null;
  filePath: string | null;
  file: File | null;
  hasFile: boolean;
};

function keptUploadPath(value: string) {
  const path = value.trim();
  if (!path) return null;
  if (path.startsWith("/uploads/") || path.startsWith("https://")) return path;
  return null;
}

function readSettlementLines(formData: FormData): SettlementLine[] {
  const contents = formData.getAll("lineContent").map(String);
  const dates = formData.getAll("lineDate").map(String);
  const amounts = formData.getAll("lineAmount").map(String);
  const names = formData.getAll("lineFileName").map(String);
  const paths = formData.getAll("lineFilePath").map(String);
  const files = formData.getAll("lineFile");
  return contents.map((content, index) => {
    const uploaded = files[index];
    const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    const filePath = file ? null : keptUploadPath(paths[index] ?? "");
    const fileName = file ? file.name : names[index]?.trim() || null;
    return {
      content: content.trim(),
      spentOn: parseDay(dates[index] ?? ""),
      amount: parseMoney(amounts[index] ?? ""),
      file,
      fileName: filePath || file ? fileName : null,
      filePath,
      hasFile: Boolean(file || filePath),
    };
  });
}

function lineStarted(line: SettlementLine) {
  return Boolean(line.content || line.amount > 0 || line.hasFile || line.spentOn);
}

async function loadVisible(id: string) {
  const user = await requireDbUser();
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { lines: true, advance: true, settlements: true },
  });
  if (!ticket || !canSeeTicket(user, ticket)) fail("/dashboard", "Không thấy phiếu này");
  return { user, ticket };
}

export async function saveAdvanceAction(formData: FormData) {
  const user = await requireDbUser();
  if (!canAct(user.role, INTERNAL_ROLES)) fail("/requests/new", "Chỉ nhân sự nội bộ tạo tạm ứng");

  const id = String(formData.get("id") || "");
  const purpose = String(formData.get("purpose") || "");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const amount = parseMoney(formData.get("amount"));
  const neededOn = parseDay(String(formData.get("neededOn") || ""));
  const settleDueOn = parseDay(String(formData.get("settleDueOn") || ""));
  const receiveMethod = String(formData.get("receiveMethod") || "");
  const bankAccount = String(formData.get("bankAccount") || "").trim();
  const intent = String(formData.get("intent") || "submit");
  const back = id ? `/requests/${id}` : "/requests/new?kind=tam_ung";

  if (!purpose || !title || !content || !amount || amount <= 0 || !neededOn || !settleDueOn || !receiveMethod) {
    fail(back, "Điền đủ mục đích, nội dung, số tiền, ngày cần tiền, hạn hoàn ứng và hình thức nhận");
  }
  if (receiveMethod === "chuyen_khoan" && !bankAccount) {
    fail(back, "Chuyển khoản cần số tài khoản");
  }

  const departmentId =
    user.role === Role.ADMIN
      ? String(formData.get("departmentId") || "")
      : user.departmentId || String(formData.get("departmentId") || "");
  if (!departmentId) fail(back, "Tài khoản chưa gắn bộ phận");

  const status = intent === "draft" ? TicketStatus.draft : TicketStatus.cho_truong_bp;
  const data = {
    title,
    content,
    amount,
    purpose,
    neededOn,
    settleDueOn,
    receiveMethod,
    bankAccount: bankAccount || null,
    departmentId,
    status,
  };

  let ticketId = id;
  if (id) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing || existing.kind !== TicketKind.tam_ung) fail(back, "Không sửa được phiếu này");
    if (existing.createdById !== user.id && user.role !== Role.ADMIN) fail(back, "Không phải phiếu của bạn");
    if (existing.status !== TicketStatus.draft && existing.status !== TicketStatus.tra_lai) {
      fail(back, "Phiếu không còn ở trạng thái sửa");
    }
    await prisma.ticket.update({ where: { id }, data });
  } else {
    const created = await prisma.ticket.create({
      data: {
        ...data,
        code: await nextTicketCode(TicketKind.tam_ung),
        kind: TicketKind.tam_ung,
        createdById: user.id,
      },
    });
    ticketId = created.id;
  }

  await saveFiles(formData, ticketId, user.id, "tam_ung");
  await log(
    ticketId,
    user.id,
    intent === "draft" ? "draft" : "submit",
    intent === "draft" ? "Lưu nháp đề nghị tạm ứng" : "Gửi đề nghị tạm ứng, chờ trưởng bộ phận duyệt",
  );
  refresh();
  redirect(`/requests/${ticketId}`);
}

export async function saveSettlementAction(formData: FormData) {
  const user = await requireDbUser();
  if (!canAct(user.role, INTERNAL_ROLES)) fail("/requests/new?kind=hoan_ung", "Chỉ nhân sự nội bộ tạo hoàn ứng");

  const id = String(formData.get("id") || "");
  const advanceId = String(formData.get("advanceId") || "");
  const titleRaw = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const isDraft = String(formData.get("intent") || "submit") === "draft";
  const back = id ? `/requests/${id}` : "/requests/new?kind=hoan_ung";
  const started = readSettlementLines(formData).filter(lineStarted);

  if (!isDraft) {
    if (!advanceId || !titleRaw) fail(back, "Chọn phiếu tạm ứng đã chi và nhập tiêu đề");
    if (started.length === 0) fail(back, "Kê ít nhất một khoản chi");
    if (started.some((line) => !line.content || line.amount <= 0 || !line.hasFile)) {
      fail(back, "Mỗi khoản chi cần nội dung, số tiền và chứng từ");
    }
  }

  let advance: { id: string; code: string; departmentId: string | null } | null = null;
  if (advanceId) {
    const found = await prisma.ticket.findUnique({
      where: { id: advanceId },
      include: { settlements: true },
    });
    if (!found || found.kind !== TicketKind.tam_ung || found.status !== TicketStatus.da_chi) {
      fail(back, "Chỉ hoàn ứng trên phiếu tạm ứng đã chi");
    }
    if (found.createdById !== user.id && user.role !== Role.ADMIN) {
      fail(back, "Chỉ hoàn ứng phiếu tạm ứng của mình");
    }
    const blocking = found.settlements.find((item) => item.id !== id && item.status !== TicketStatus.tu_choi);
    if (blocking) fail(back, "Phiếu tạm ứng này đã có hoàn ứng đang xử lý");
    advance = found;
  } else if (!isDraft) {
    fail(back, "Chọn phiếu tạm ứng đã chi và nhập tiêu đề");
  }

  const title = titleRaw || "Hoàn ứng nháp";
  const amount = sumAmounts(started);
  const status = isDraft ? TicketStatus.draft : TicketStatus.cho_truong_bp;
  const data = {
    title,
    content: content || title,
    amount,
    advanceId: advance?.id ?? null,
    departmentId: advance?.departmentId ?? user.departmentId,
    status,
  };

  let ticketId = id;
  if (id) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing || existing.kind !== TicketKind.hoan_ung) fail(back, "Không sửa được phiếu này");
    if (existing.createdById !== user.id && user.role !== Role.ADMIN) fail(back, "Không phải phiếu của bạn");
    if (existing.status !== TicketStatus.draft && existing.status !== TicketStatus.tra_lai) {
      fail(back, "Phiếu không còn ở trạng thái sửa");
    }
    await prisma.ticket.update({ where: { id }, data });
  } else {
    const created = await prisma.ticket.create({
      data: {
        ...data,
        code: await nextTicketCode(TicketKind.hoan_ung),
        kind: TicketKind.hoan_ung,
        createdById: user.id,
      },
    });
    ticketId = created.id;
  }

  const stored: {
    ticketId: string;
    content: string;
    spentOn: Date | null;
    amount: number;
    fileName: string | null;
    filePath: string | null;
  }[] = [];
  for (const line of started) {
    let filePath = line.filePath;
    let fileName = line.fileName;
    if (line.file) {
      filePath = await saveUpload(line.file, ticketId);
      fileName = line.file.name;
      if (!filePath) fail(back, "Không lưu được chứng từ");
    }
    stored.push({
      ticketId,
      content: line.content,
      spentOn: line.spentOn,
      amount: line.amount,
      fileName,
      filePath,
    });
  }
  if (!isDraft && stored.some((line) => !line.filePath)) fail(back, "Mỗi khoản chi cần chứng từ");

  await prisma.expenseLine.deleteMany({ where: { ticketId } });
  if (stored.length > 0) await prisma.expenseLine.createMany({ data: stored });

  await log(
    ticketId,
    user.id,
    isDraft ? "draft" : "submit",
    isDraft ? "Lưu nháp đề nghị hoàn ứng" : `Gửi hoàn ứng ${formatVnd(amount)} cho phiếu ${advance?.code ?? ""}`,
  );
  refresh();
  redirect(`/requests/${ticketId}`);
}

export async function savePaymentAction(formData: FormData) {
  const user = await requireDbUser();
  if (!canAct(user.role, [Role.NCC])) fail("/ncc", "Chỉ nhà thầu tạo đề nghị thanh toán");

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const contractNumber = String(formData.get("contractNumber") || "").trim();
  const contractValue = parseMoney(formData.get("contractValue"));
  const installment = Number(formData.get("installment"));
  const amount = parseMoney(formData.get("amount"));
  const departmentId = String(formData.get("departmentId") || "");
  const vendorId = user.role === Role.ADMIN ? String(formData.get("vendorId") || "") : user.vendorId;
  const intent = String(formData.get("intent") || "submit");
  const back = id ? `/requests/${id}` : "/ncc";

  if (!title || !contractNumber || !contractValue || contractValue <= 0 || !installment || !amount || amount <= 0) {
    fail(back, "Điền đủ hợp đồng, đợt thanh toán và số tiền");
  }
  if (!departmentId || !vendorId) fail(back, "Chọn bộ phận phụ trách và nhà thầu");

  const committed = await prisma.ticket.aggregate({
    where: {
      kind: TicketKind.thanh_toan,
      vendorId,
      contractNumber,
      id: id ? { not: id } : undefined,
      status: { in: committedPaymentStatuses() },
    },
    _sum: { amount: true },
  });
  const used = committed._sum.amount ?? 0;
  if (used + amount > contractValue) {
    fail(
      back,
      `Lũy kế ${Math.round(used + amount).toLocaleString("vi-VN")} đ vượt giá trị hợp đồng ${Math.round(contractValue).toLocaleString("vi-VN")} đ`,
    );
  }

  const status = intent === "draft" ? TicketStatus.draft : TicketStatus.cho_truong_bp;
  const data = {
    title,
    content: content || title,
    amount,
    contractNumber,
    contractValue,
    installment,
    departmentId,
    vendorId,
    status,
  };

  let ticketId = id;
  if (id) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing || existing.kind !== TicketKind.thanh_toan) fail(back, "Không sửa được phiếu này");
    if (user.role === Role.NCC && existing.vendorId !== user.vendorId) fail(back, "Không phải phiếu của nhà thầu");
    if (existing.status !== TicketStatus.draft && existing.status !== TicketStatus.tra_lai) {
      fail(back, "Phiếu không còn ở trạng thái sửa");
    }
    await prisma.ticket.update({ where: { id }, data });
  } else {
    const created = await prisma.ticket.create({
      data: {
        ...data,
        code: await nextTicketCode(TicketKind.thanh_toan),
        kind: TicketKind.thanh_toan,
        createdById: user.id,
      },
    });
    ticketId = created.id;
  }

  await saveFiles(formData, ticketId, user.id, "thanh_toan");
  await log(
    ticketId,
    user.id,
    intent === "draft" ? "draft" : "submit",
    intent === "draft"
      ? "Lưu nháp đề nghị thanh toán"
      : `Gửi đề nghị thanh toán đợt ${installment}, chờ bộ phận phụ trách xác nhận`,
  );
  refresh();
  redirect(`/requests/${ticketId}`);
}

async function closeSettlement(
  ticketId: string,
  advanceId: string,
  userId: string,
  message: string,
  extra?: { paidAt?: Date; paymentRef?: string; paidNote?: string },
) {
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.da_quyet_toan,
        paidAt: extra?.paidAt ?? new Date(),
        paidById: userId,
        ...(extra?.paymentRef ? { paymentRef: extra.paymentRef } : {}),
        ...(extra?.paidNote ? { paidNote: extra.paidNote } : {}),
      },
    }),
    prisma.ticket.update({
      where: { id: advanceId },
      data: { status: TicketStatus.da_hoan_ung },
    }),
  ]);
  await log(ticketId, userId, "settle", message);
  await log(advanceId, userId, "settled", "Tạm ứng đã được hoàn ứng");
}

export async function decideAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");
  const comment = String(formData.get("comment") || "").trim();
  const { user, ticket } = await loadVisible(id);
  const back = `/requests/${id}`;

  if (decision === "reject" || decision === "return") {
    if (!comment) fail(back, "Cần ghi lý do");
  } else if (decision !== "approve") {
    fail(back, "Thao tác không hợp lệ");
  }

  if (ticket.status === TicketStatus.cho_truong_bp) {
    if (!canAct(user.role, [Role.TRUONG_BO_PHAN])) fail(back, "Chỉ trưởng bộ phận xử lý bước này");
    if (user.role === Role.TRUONG_BO_PHAN && user.departmentId !== ticket.departmentId) {
      fail(back, "Phiếu không thuộc bộ phận của bạn");
    }
  } else if (ticket.status === TicketStatus.cho_ke_toan) {
    if (!canAct(user.role, [Role.KE_TOAN])) fail(back, "Chỉ kế toán xử lý bước này");
  } else if (ticket.status === TicketStatus.cho_lanh_dao) {
    if (!canAct(user.role, [Role.LANH_DAO])) fail(back, "Chỉ ban lãnh đạo xử lý bước này");
  } else {
    fail(back, "Phiếu không đang chờ duyệt");
  }

  if (ticket.createdById === user.id) fail(back, "Không tự duyệt phiếu của mình");

  if (decision === "reject") {
    await prisma.ticket.update({ where: { id }, data: { status: TicketStatus.tu_choi } });
    await prisma.approval.create({
      data: { ticketId: id, stage: ticket.status, decision: "tu_choi", comment, userId: user.id },
    });
    await log(id, user.id, "reject", `Từ chối: ${comment}`);
    refresh();
    redirect(back);
  }

  if (decision === "return") {
    const status = ticket.kind === TicketKind.thanh_toan ? TicketStatus.tra_lai : TicketStatus.draft;
    await prisma.ticket.update({ where: { id }, data: { status } });
    await prisma.approval.create({
      data: { ticketId: id, stage: ticket.status, decision: "tra_lai", comment, userId: user.id },
    });
    await log(id, user.id, "return", `Trả lại để sửa: ${comment}`);
    refresh();
    redirect(back);
  }

  let next: TicketStatus = TicketStatus.cho_ke_toan;
  let message = "Đồng ý, chuyển bước tiếp theo";

  if (ticket.status === TicketStatus.cho_truong_bp) {
    next = TicketStatus.cho_ke_toan;
    message =
      ticket.kind === TicketKind.thanh_toan
        ? "Xác nhận khối lượng, chuyển kế toán"
        : "Trưởng bộ phận duyệt, chuyển kế toán";
  } else if (ticket.status === TicketStatus.cho_lanh_dao) {
    next = TicketStatus.cho_chi;
    message = "Lãnh đạo duyệt, chuyển kế toán chi tiền";
  } else if (ticket.kind === TicketKind.hoan_ung) {
    if (!ticket.advance) fail(back, "Hoàn ứng chưa gắn phiếu tạm ứng");
    const diff = settlementDiff(ticket.amount, ticket.advance.amount);
    if (diff > 0) {
      next = TicketStatus.cho_lanh_dao;
      message = "Chứng từ hợp lệ. Chi vượt số ứng, chuyển lãnh đạo duyệt phần vượt";
    } else if (diff < 0) {
      next = TicketStatus.cho_chi;
      message = "Chứng từ hợp lệ. Chờ thu tiền thừa";
    } else {
      await prisma.approval.create({
        data: { ticketId: id, stage: ticket.status, decision: "dong_y", comment: comment || null, userId: user.id },
      });
      await closeSettlement(id, ticket.advance.id, user.id, "Chi đúng số đã ứng, quyết toán xong");
      refresh();
      redirect(back);
    }
  } else if (ticket.kind === TicketKind.thanh_toan) {
    const committed = await prisma.ticket.aggregate({
      where: {
        kind: TicketKind.thanh_toan,
        vendorId: ticket.vendorId,
        contractNumber: ticket.contractNumber,
        id: { not: ticket.id },
        status: { in: [TicketStatus.cho_lanh_dao, TicketStatus.cho_chi, TicketStatus.da_thanh_toan] },
      },
      _sum: { amount: true },
    });
    const used = (committed._sum.amount ?? 0) + ticket.amount;
    if ((ticket.contractValue ?? 0) < used) {
      fail(back, "Lũy kế thanh toán vượt giá trị hợp đồng");
    }
    next = TicketStatus.cho_lanh_dao;
    message = "Hóa đơn và lũy kế hợp lệ, chuyển lãnh đạo";
  } else {
    next = TicketStatus.cho_lanh_dao;
    message = "Kế toán đồng ý, chuyển lãnh đạo duyệt";
  }

  await prisma.ticket.update({ where: { id }, data: { status: next } });
  await prisma.approval.create({
    data: { ticketId: id, stage: ticket.status, decision: "dong_y", comment: comment || null, userId: user.id },
  });
  await log(id, user.id, "approve", comment ? `${message}. ${comment}` : message);
  refresh();
  redirect(back);
}

export async function payAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const paymentRef = String(formData.get("paymentRef") || "").trim();
  const paidAt = parseDay(String(formData.get("paidAt") || ""));
  const paidNote = String(formData.get("paidNote") || "").trim();
  const { user, ticket } = await loadVisible(id);
  const back = `/requests/${id}`;

  if (!canAct(user.role, [Role.KE_TOAN])) fail(back, "Chỉ kế toán chi hoặc thu tiền");
  if (ticket.status !== TicketStatus.cho_chi) fail(back, "Phiếu chưa tới bước chi tiền");
  if (!paymentRef || !paidAt) fail(back, "Cần ngày và số chứng từ");

  if (ticket.kind === TicketKind.hoan_ung) {
    if (!ticket.advanceId) fail(back, "Hoàn ứng chưa gắn phiếu tạm ứng");
    await closeSettlement(id, ticket.advanceId, user.id, `Quyết toán xong, chứng từ ${paymentRef}`, {
      paidAt,
      paymentRef,
      paidNote,
    });
    refresh();
    redirect(back);
  }

  const status = ticket.kind === TicketKind.tam_ung ? TicketStatus.da_chi : TicketStatus.da_thanh_toan;
  await prisma.ticket.update({
    where: { id },
    data: {
      status,
      paymentRef,
      paidAt,
      paidNote: paidNote || null,
      paidById: user.id,
    },
  });
  await log(
    id,
    user.id,
    "pay",
    ticket.kind === TicketKind.tam_ung
      ? `Đã chi tạm ứng, chứng từ ${paymentRef}`
      : `Đã thanh toán, ủy nhiệm chi ${paymentRef}`,
  );
  refresh();
  redirect(back);
}
