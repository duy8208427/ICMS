export const Role = {
  USER: "USER",
  TRUONG_BO_PHAN: "TRUONG_BO_PHAN",
  KE_TOAN: "KE_TOAN",
  LANH_DAO: "LANH_DAO",
  NCC: "NCC",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABEL: Record<string, string> = {
  USER: "Nhân viên",
  TRUONG_BO_PHAN: "Trưởng bộ phận",
  KE_TOAN: "Kế toán",
  LANH_DAO: "Ban lãnh đạo",
  NCC: "Nhà thầu",
  ADMIN: "Quản trị",
};

export const TicketKind = {
  tam_ung: "tam_ung",
  hoan_ung: "hoan_ung",
  thanh_toan: "thanh_toan",
} as const;
export type TicketKind = (typeof TicketKind)[keyof typeof TicketKind];

export const TicketStatus = {
  draft: "draft",
  cho_truong_bp: "cho_truong_bp",
  cho_ke_toan: "cho_ke_toan",
  cho_lanh_dao: "cho_lanh_dao",
  cho_chi: "cho_chi",
  da_chi: "da_chi",
  da_hoan_ung: "da_hoan_ung",
  da_quyet_toan: "da_quyet_toan",
  da_thanh_toan: "da_thanh_toan",
  tu_choi: "tu_choi",
  tra_lai: "tra_lai",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
