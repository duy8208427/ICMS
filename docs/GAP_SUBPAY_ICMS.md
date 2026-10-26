# Báo cáo khoảng trống: SubPay (PD-SUBPAY-01) so với ICMS

Nguồn: `Mo_ta_san_pham_Tam_ung_Hoan_ung_Thanh_toan_thau_phu.docx` (PD-SUBPAY-01, phiên bản 1.0, 22/10/2026).

Đối chiếu code: `prisma/schema.prisma`, `USERGUIDE.md`, `lib/enums.ts`, `app/actions/tickets.ts`.

Ngày chốt: 22/10/2026. Không sửa ứng dụng trong bước này. Wave triển khai chỉ mở sau khi nghiệp vụ chọn phạm vi.

## 1. Kết luận

Cần bổ sung. ICMS và tài liệu dùng cùng tên “tạm ứng / hoàn ứng / thanh toán” nhưng là hai nghiệp vụ khác nhau.

- Tài liệu: tiền ứng cho **thầu phụ theo hợp đồng**, thu hồi bằng khấu trừ các đợt thanh toán khối lượng (IPC), kèm BOQ, bảo lãnh, giữ lại bảo hành, quyết toán.
- ICMS (`USERGUIDE.md`): phiếu **tạm ứng nhân viên** (công tác, tiếp khách, sự kiện), hoàn ứng bằng chứng từ chi, và nhà thầu gửi một số tiền theo hợp đồng ghi tay ngoài hệ thống.

Trong tài liệu, phần giống ICMS nhất là **M07 Tạm ứng nội bộ**, xếp **tùy chọn, giai đoạn 2**. Lõi bắt buộc giai đoạn 1 là M01–M06. ICMS đang đi ngược thứ tự đó: đã làm M07, chỉ có một lát mỏng của thanh toán nhà thầu.

```
Tài liệu GĐ1: HĐ, BOQ, TU thầu phụ, IPC, thu hồi, giữ lại, BL
        └── chưa có ──► ICMS: phiếu TU nội bộ, HU chứng từ, TT một số tiền
```

Không vá thêm field trên form thanh toán hiện tại. Lõi hợp đồng–khối lượng–thu hồi cần miền dữ liệu riêng bên cạnh `Ticket`.

## 2. Đã có trong ICMS — giữ lại

- Ba loại phiếu trên một model `Ticket`: `tam_ung`, `hoan_ung`, `thanh_toan` (`lib/enums.ts`).
- Luồng cố định: nháp → trưởng bộ phận → kế toán → lãnh đạo → chi. Hoàn ứng chỉ qua lãnh đạo khi chi vượt.
- Hoàn ứng nội bộ: kê dòng chi, chênh thừa/thiếu/đủ, khóa một tạm ứng đang có hoàn ứng khác.
- Cổng nhà thầu: số HĐ, giá trị, đợt, số tiền, file hồ sơ. Chặn lũy kế vượt giá trị HĐ khi gửi (`savePaymentAction`).
- Cảnh báo tạm ứng nội bộ quá hạn (không chặn tạo phiếu mới).
- Phân quyền theo vai trò, hộp việc, nhật ký thao tác dạng message, đính kèm file.
- `Vendor` chỉ có tên, MST, địa chỉ. Không có tài khoản ngân hàng, trạng thái khóa, hợp đồng.

## 3. Khoảng trống theo phân hệ tài liệu

Ưu tiên lấy từ tài liệu (P1 = MVP). “Có một phần” nghĩa là cùng ý tưởng nhưng thiếu quy tắc.

| Phân hệ | Mức hiện tại | Việc thiếu so với P1 / tiêu chí tài liệu |
| --- | --- | --- |
| M01 Danh mục và hợp đồng | Chưa có | Hồ sơ NTP (nhiều TK, TK mặc định đã xác minh, khóa/danh sách đen, chống trùng MST), dự án/mã chi phí, hợp đồng thật (loại HĐ, trước/sau VAT, hiệu lực), điều khoản thanh toán, BOQ cây, phụ lục đổi giá trị hiện hành. ICMS để nhà thầu gõ `contractNumber` và `contractValue` mỗi phiếu. |
| M02 Tạm ứng thầu phụ | Chưa có | Tạm ứng ICMS là tiền nhân viên, không gắn HĐ, không trần, không bảo lãnh, không lịch thu hồi. Sau khi chi không sinh số dư phải thu hồi. |
| M03 Nghiệm thu và hồ sơ thanh toán | Chưa có | Không có dòng BOQ, ba cấp khối lượng (NTP / kỹ thuật / QS), công thức mục 5 (`A + E − B − C − D`), khấu trừ khác, checklist bắt buộc mới được gửi. File đính kèm là một nhóm, không phân loại. |
| M04 Thanh toán | Một phần | Có duyệt và ghi một lần `paidAt` + `paymentRef`. Thiếu đối chiếu hóa đơn (MST, số tiền), hạn thanh toán, chi một phần, file UNC. Đối soát sao kê là P2. |
| M05 Thu hồi tạm ứng thầu phụ | Chưa có | “Hoàn ứng” ICMS là quyết toán chứng từ nhân viên, không phải khấu trừ trên đợt thanh toán, hoàn trả trực tiếp, hay sổ dư theo HĐ. |
| M06 Bảo lãnh, giữ lại, quyết toán | Chưa có | P1: sổ bảo lãnh, tiền giữ lại, quyết toán HĐ. |
| M07 Tạm ứng nội bộ | Gần đủ demo | Đã có đề nghị, hạn hoàn ứng, kê chứng từ, chênh lệch. Thiếu mã chi phí dự án, hạn mức theo chức danh, **chặn** khi còn khoản quá hạn (`USERGUIDE.md` ghi rõ vẫn tạo được). OCR (P3) bỏ qua. |
| M08 Workflow | Một phần | Luồng cứng 4 bước. Không cấu hình theo giá trị/dự án/loại chứng từ, không trả về một bước bất kỳ (trả lại nội bộ về Nháp), không ủy quyền, không SLA, không email/Zalo. Hộp việc trong app đủ cho thông báo tối thiểu. |
| M09 Báo cáo | Chưa có | Hộp việc có vài số đếm. Không có dashboard công nợ, sổ chi tiết NTP, tuổi tạm ứng 0–30/31–60/61–90/>90, xuất Excel/PDF. |
| M10 Quản trị | Một phần | Có login cục bộ và timeline. Thiếu SSO, 2FA cổng NTP, audit trước/sau + IP bất biến, tham số hệ thống, object storage. `Ticket.amount` đang là `Float` — trái BR-07. |

## 4. Quy tắc bắt buộc tài liệu mà ICMS chưa giữ

- **BR-01.** Lũy kế thanh toán không vượt giá trị HĐ **hiện hành** (gốc + phụ lục). ICMS chỉ so với số gõ trên phiếu, và chỉ lúc gửi, không khóa lại lúc kế toán duyệt.
- **BR-02, BR-03.** Trần tạm ứng và bảo lãnh tạm ứng — không có thực thể.
- **BR-04.** Một HĐ chỉ một hồ sơ thanh toán đang xử lý — chưa chặn.
- **BR-05.** Người lập không được duyệt phiếu của mình. `canAct` cho phép `ADMIN` bấm mọi bước; chưa có kiểm tra “người lập ≠ người duyệt” ở backend.
- **BR-06.** TK nhận phải là TK đã đăng ký và xác minh. Tạm ứng nội bộ gõ số TK tự do; thanh toán nhà thầu không có TK nhận.
- **BR-07.** Không dùng float cho tiền.
- **BR-08.** Chứng từ đã duyệt khóa, sửa bằng chứng từ điều chỉnh. Chưa có chứng từ điều chỉnh; đã chi thì không sửa, đúng một phần.
- **BR-09, BR-10.** Hóa đơn khớp MST; NTP bị khóa thì không thanh toán — chưa có.

Công thức mục 5.3 (HĐ 10 tỷ, tạm ứng 15%, giữ lại 5%, VAT 8%, ba đợt ra 1,74 / 2,64 / 4,4 tỷ) chưa có thư viện tính và test. Tài liệu coi đây là phần rủi ro cao nhất, nên làm trước khi gắn UI.

Số dư tạm ứng thầu phụ phải tính `Advance − Σ AdvanceRecovery`, không lưu một field cộng trừ. ICMS chưa có hai bảng này.

## 5. Không nhét vào model Ticket hiện tại

`Ticket` đang gộp phiếu nội bộ và phiếu nhà thầu. Lõi tài liệu cần:

`Contract`, `PaymentTerm`, `BOQItem`, `Advance`, `AdvanceRecovery`, `PaymentCert`, `PaymentCertLine`, `Deduction`, `Guarantee`, `Retention`, `Disbursement`.

Gắn BOQ và công thức vào `Ticket.amount` sẽ làm lệch sổ khi phiếu bị trả lại. Tài liệu yêu cầu thu hồi và giữ lại chỉ ghi sổ khi trạng thái “Đã duyệt – chờ chi”.

Giữ M07 trên `Ticket`. Thêm miền hợp đồng thầu phụ bên cạnh.

## 6. Backlog — chưa làm

### Giai đoạn 1 (theo mục 8 tài liệu)

1. Thư viện tính thuần (mục 5) + test bộ số 5.3, gồm cơ sở trước/sau VAT là tham số theo HĐ.
2. Danh mục NTP, TK ngân hàng, hợp đồng, điều khoản, BOQ, phụ lục (M01).
3. Tạm ứng thầu phụ + bảo lãnh + ghi nhận chi (M02, F06.01).
4. Hồ sơ thanh toán đợt: 3 cấp khối lượng, khấu trừ, checklist (M03).
5. Ghi sổ thu hồi và giữ lại chỉ khi duyệt chi; chi một phần; hạn thanh toán (M04, M05, F06.02–03).
6. Sổ dư, dashboard, tuổi tạm ứng, xuất Excel (M09).
7. Đổi tiền sang Decimal, SoD, audit trước/sau.

### Giai đoạn 2

Cổng NTP đầy đủ, kế hoạch chi, đối soát ngân hàng, cấn trừ chéo, hoàn trả giữ lại, thanh lý, SLA, ủy quyền, siết M07 (hạn mức, chặn quá hạn, mã chi phí), tích hợp kế toán và hóa đơn.

### Giai đoạn 3 — bỏ qua lúc này

Ký số, API ngân hàng, OCR, dự báo dòng tiền.

## 7. Việc nghiệp vụ cần chốt trước khi code

Mục 9 tài liệu còn mở, và nó đổi schema:

- Ngưỡng đưa lên Ban giám đốc.
- Thu hồi và giữ lại tính trước hay sau VAT, thống nhất hay theo từng HĐ.
- Giai đoạn 1 do QS nhập thay hay thầu phụ tự nhập.
- Phần mềm kế toán và định dạng file chi lô.
- Danh mục khấu trừ chuẩn.
- Hạn mức và thời hạn hoàn ứng nội bộ của công ty (để siết M07).
- Có hợp đồng ngoại tệ hoặc điều chỉnh giá theo chỉ số không.

## 8. Rủi ro nếu bổ sung nửa vời

Nếu chỉ thêm field trên form thanh toán hiện tại (trần tạm ứng, % giữ lại) mà không có HĐ, BOQ và sổ thu hồi, số liệu Ban chỉ huy và kế toán vẫn lệch — đúng vấn đề mục 1.1 của tài liệu.

Cảnh báo quá hạn nội bộ không thay thế cảnh báo tạm ứng thầu phụ chưa có khối lượng hoặc bảo lãnh sắp hết hạn.
