using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using BuildingMaterialAPI.Models;
using BuildingMaterialAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterialAPI.Services
{
    public interface IVatInvoiceService
    {
        Task<byte[]> GeneratePdfAsync(int hoaDonId);
        Task SendInvoiceEmailAsync(int hoaDonId);
    }

    public class VatInvoiceService : IVatInvoiceService
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IEmailService _emailService;

        public VatInvoiceService(ApplicationDbContext ctx, IEmailService emailService)
        {
            _ctx = ctx;
            _emailService = emailService;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GeneratePdfAsync(int hoaDonId)
        {
            var hd = await _ctx.HoaDons
                .Include(h => h.KhachHang)
                .Include(h => h.NhanVien)
                .Include(h => h.CTHDs).ThenInclude(ct => ct.SanPham)
                .FirstOrDefaultAsync(h => h.MaHoaDon == hoaDonId);

            if (hd == null) throw new Exception("Không tìm thấy hóa đơn.");
            if (!hd.YeuCauVat) throw new Exception("Đơn hàng này không yêu cầu xuất hóa đơn GTGT.");

            // --- Tính thuế (Chế độ: Giá ĐÃ bao gồm thuế - Tax Inclusive) ---
            const decimal VAT_RATE = 0.08m; // 8% mặc định

            var items = (hd.CTHDs ?? new List<CTHD>())
                .Where(ct => ct.SanPham != null)
                .Select(ct => {
                    decimal thanhTienSauThue = (ct.ThanhTien ?? (ct.SoLuong * ct.DonGia - ct.GiamGia));
                    decimal thanhTienTruocThue = Math.Round(thanhTienSauThue / (1 + VAT_RATE), 0);
                    decimal tienThue = thanhTienSauThue - thanhTienTruocThue;
                    
                    return new VatLineItem
                    {
                        TenHangHoa = ct.SanPham!.TenSP ?? "Sản phẩm",
                        DonViTinh = ct.SanPham.DonViTinh ?? "Cái",
                        SoLuong = ct.SoLuong,
                        DonGiaChietKhau = Math.Round((thanhTienSauThue / ct.SoLuong), 0), // Đơn giá đã gồm thuế
                        TienChietKhau = ct.GiamGia,
                        ThanhTienTruocThue = thanhTienTruocThue,
                        ThueSuat = VAT_RATE,
                        TienThueGTGT = tienThue,
                    };
                })
                .ToList();

            // Thêm phí vận chuyển (nếu có)
            if (hd.PhiVanChuyen > 0)
            {
                decimal phiSauThue = hd.PhiVanChuyen;
                decimal phiTruocThue = Math.Round(phiSauThue / (1 + VAT_RATE), 0);
                decimal thuePhi = phiSauThue - phiTruocThue;

                items.Add(new VatLineItem
                {
                    TenHangHoa = "Phí vận chuyển / Giao hàng",
                    DonViTinh = "Chuyến",
                    SoLuong = 1,
                    DonGiaChietKhau = phiSauThue,
                    TienChietKhau = 0,
                    ThanhTienTruocThue = phiTruocThue,
                    ThueSuat = VAT_RATE,
                    TienThueGTGT = thuePhi
                });
            }

            // Trừ chiết khấu / giảm giá đơn hàng (nếu có)
            if (hd.GiamGia > 0)
            {
                decimal giamSauThue = hd.GiamGia;
                decimal giamTruocThue = Math.Round(giamSauThue / (1 + VAT_RATE), 0);
                decimal thueGiam = giamSauThue - giamTruocThue;

                items.Add(new VatLineItem
                {
                    TenHangHoa = "Chiết khấu / Giảm giá đơn hàng",
                    DonViTinh = "Gói",
                    SoLuong = 1,
                    DonGiaChietKhau = -giamSauThue,
                    TienChietKhau = 0,
                    ThanhTienTruocThue = -giamTruocThue,
                    ThueSuat = VAT_RATE,
                    TienThueGTGT = -thueGiam
                });
            }

            decimal tongTruocThue = items.Sum(i => i.ThanhTienTruocThue);
            decimal tongThue = items.Sum(i => i.TienThueGTGT);
            decimal tongSauThue = tongTruocThue + tongThue;

            // Tên người mua
            string tenNguoiMua = hd.VatType == "business"
                ? (hd.VatCompanyName ?? "Người mua không lấy hóa đơn")
                : (hd.VatBuyerName ?? hd.KhachHang?.TenKH ?? "Người mua không lấy hóa đơn");
            string maSoThue = hd.VatTaxId ?? string.Empty;
            string diaChiNguoiMua = hd.VatType == "business"
                ? (hd.VatCompanyAddress ?? string.Empty)
                : (hd.VatAddress ?? string.Empty);
            string emailNguoiMua = hd.VatEmail ?? string.Empty;

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9));

                    page.Content().Column(col =>
                    {
                        // ---- HEADER ----
                        col.Item().Row(row =>
                        {
                            // Logo + Tên công ty
                            row.RelativeItem(3).Column(c =>
                            {
                                c.Item().Text("CÔNG TY CỔ PHẦN VLXD")
                                    .FontSize(11).Bold().FontColor(Colors.Blue.Darken3);
                                c.Item().Text("Địa chỉ: 123 Đường Lý Thường Kiệt, Q.10, TP.HCM").FontSize(8);
                                c.Item().Text("Mã số thuế: 0123456789").FontSize(8);
                                c.Item().Text("Điện thoại: 028-3800-1234").FontSize(8);
                                c.Item().Text("Email: vlxd@company.com").FontSize(8);
                            });

                            // Title block
                            row.RelativeItem(2).AlignCenter().Column(c =>
                            {
                                c.Item().AlignCenter().Text("HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                                    .FontSize(14).Bold().FontColor(Colors.Red.Darken2);
                                c.Item().AlignCenter().Text("(VAT INVOICE)").FontSize(9).Italic();
                                c.Item().PaddingTop(4).AlignCenter()
                                    .Text(txt =>
                                    {
                                        txt.Span("Ngày ").FontSize(8);
                                        txt.Span(hd.NgayLap.Day.ToString()).Bold().FontSize(8);
                                        txt.Span(" tháng ").FontSize(8);
                                        txt.Span(hd.NgayLap.Month.ToString()).Bold().FontSize(8);
                                        txt.Span(" năm ").FontSize(8);
                                        txt.Span(hd.NgayLap.Year.ToString()).Bold().FontSize(8);
                                    });
                                c.Item().AlignCenter().Text($"Số: {hd.MaHD}").FontSize(9).Bold();
                            });
                        });

                        col.Item().PaddingVertical(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        // ---- THÔNG TIN NGƯỜI MUA ----
                        col.Item().Column(c =>
                        {
                            c.Item().Row(r =>
                            {
                                r.AutoItem().Text("Họ và tên người mua hàng (Buyer): ").Bold();
                                r.RelativeItem().Text(tenNguoiMua);
                            });
                            if (hd.VatType == "business")
                            {
                                c.Item().Row(r =>
                                {
                                    r.AutoItem().Text("Tên đơn vị (Company's Name): ").Bold();
                                    r.RelativeItem().Text(hd.VatCompanyName ?? "");
                                });
                                c.Item().Row(r =>
                                {
                                    r.AutoItem().Text("Mã số thuế (Tax Code): ").Bold();
                                    r.RelativeItem().Text(maSoThue);
                                });
                            }
                            c.Item().Row(r =>
                            {
                                r.AutoItem().Text("Địa chỉ (Address): ").Bold();
                                r.RelativeItem().Text(diaChiNguoiMua);
                            });
                            c.Item().Row(r =>
                            {
                                r.AutoItem().Text("Email: ").Bold();
                                r.RelativeItem().Text(emailNguoiMua);
                            });
                            c.Item().Row(r =>
                            {
                                r.AutoItem().Text("Hình thức thanh toán (Payment method): ").Bold();
                                r.RelativeItem().Text(hd.PTTT ?? "Tiền mặt");
                            });
                        });

                        col.Item().PaddingTop(8);

                        // ---- BẢNG CHI TIẾT ----
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.ConstantColumn(25);   // STT
                                cols.RelativeColumn(5);    // Tên hàng hóa
                                cols.ConstantColumn(35);   // ĐVT
                                cols.ConstantColumn(35);   // Số lượng
                                cols.ConstantColumn(60);   // Đơn giá
                                cols.ConstantColumn(50);   // Tiền chiết khấu
                                cols.ConstantColumn(65);   // Thành tiền trước thuế
                                cols.ConstantColumn(35);   // Thuế suất
                                cols.ConstantColumn(55);   // Tiền thuế GTGT
                                cols.ConstantColumn(65);   // Thành tiền sau thuế
                            });

                            // Header
                            static IContainer HeaderCell(IContainer container) =>
                                container.DefaultTextStyle(x => x.Bold().FontSize(8))
                                    .Border(1).BorderColor(Colors.Grey.Lighten2)
                                    .Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2);

                            table.Header(h =>
                            {
                                h.Cell().Element(HeaderCell).AlignCenter().Text("STT");
                                h.Cell().Element(HeaderCell).Text("Tên hàng hóa, dịch vụ\n(Description)");
                                h.Cell().Element(HeaderCell).AlignCenter().Text("ĐVT\n(Unit)");
                                h.Cell().Element(HeaderCell).AlignCenter().Text("Số lượng\n(Qty)");
                                h.Cell().Element(HeaderCell).AlignRight().Text("Đơn giá chiết khấu\n(Unit Price)");
                                h.Cell().Element(HeaderCell).AlignRight().Text("Tiền chiết khấu\n(Discount)");
                                h.Cell().Element(HeaderCell).AlignRight().Text("Thành tiền trước thuế GTGT\n(Amount)");
                                h.Cell().Element(HeaderCell).AlignCenter().Text("Thuế suất GTGT\n(Tax Rate)");
                                h.Cell().Element(HeaderCell).AlignRight().Text("Tiền thuế GTGT\n(Tax Amount)");
                                h.Cell().Element(HeaderCell).AlignRight().Text("Thành tiền sau thuế GTGT\n(Total Amount)");
                            });

                            static IContainer DataCell(IContainer container) =>
                                container.Border(1).BorderColor(Colors.Grey.Lighten2)
                                    .PaddingVertical(2).PaddingHorizontal(2);

                            for (int i = 0; i < items.Count; i++)
                            {
                                var item = items[i];
                                var isEven = i % 2 == 0;
                                var bg = isEven ? Colors.White : Colors.Grey.Lighten4;

                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignCenter().Text($"{i + 1}").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).Text(item.TenHangHoa).FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignCenter().Text(item.DonViTinh).FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignCenter().Text(item.SoLuong.ToString()).FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignRight().Text($"{item.DonGiaChietKhau:N0}").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignRight().Text(item.TienChietKhau > 0 ? $"{item.TienChietKhau:N0}" : "—").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignRight().Text($"{item.ThanhTienTruocThue:N0}").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignCenter().Text($"{item.ThueSuat * 100:0}%").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignRight().Text($"{item.TienThueGTGT:N0}").FontSize(8);
                                table.Cell().Element(c => DataCell(c).Background(bg)).AlignRight().Text($"{item.ThanhTienTruocThue + item.TienThueGTGT:N0}").FontSize(8).Bold();
                            }

                            // Tổng hợp
                            table.Cell().ColumnSpan(6).Element(c =>
                                c.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2))
                                .AlignCenter().Text("Tổng hợp (Summary)").Bold().FontSize(8);

                            table.Cell().Element(c =>
                                c.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2))
                                .AlignRight().Text($"{tongTruocThue:N0}").Bold().FontSize(8);
                            table.Cell().Element(c =>
                                c.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2))
                                .AlignCenter().Text("Thành tiền trước thuế GTGT\n(Amount before tax)").Bold().FontSize(7);
                            table.Cell().Element(c =>
                                c.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2))
                                .AlignRight().Text($"{tongThue:N0}").Bold().FontSize(8);
                            table.Cell().Element(c =>
                                c.Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Blue.Lighten4)
                                    .PaddingVertical(3).PaddingHorizontal(2))
                                .AlignRight().Text($"{tongSauThue:N0}").Bold().FontSize(8);
                        });

                        col.Item().PaddingTop(6);

                        // ---- SỐ TIỀN BẰNG CHỮ ----
                        col.Item().Text(txt =>
                        {
                            txt.Span("Số tiền viết bằng chữ (Amount in words): ").Bold();
                            txt.Span(NumberToText(tongSauThue));
                        });

                        col.Item().PaddingTop(12);

                        // ---- CHỮ KÝ ----
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().AlignCenter().Text("Người mua hàng").Bold();
                                c.Item().AlignCenter().Text("(Buyer)").Italic().FontSize(8);
                                c.Item().PaddingTop(30).AlignCenter().Text(tenNguoiMua).FontSize(8);
                            });
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().AlignCenter().Text("Đơn vị bán hàng").Bold();
                                c.Item().AlignCenter().Text("(Seller)").Italic().FontSize(8);
                                c.Item().PaddingTop(6).AlignCenter()
                                    .Text("CÔNG TY CỔ PHẦN VLXD").FontSize(8).Bold().FontColor(Colors.Red.Medium);
                                c.Item().AlignCenter().Text("(Chữ ký số / Digital Signature)").FontSize(7).Italic().FontColor(Colors.Blue.Darken3);
                                c.Item().PaddingTop(10).AlignCenter().Text($"Ký ngày: {hd.NgayLap:dd-MM-yyyy}").FontSize(7);
                            });
                        });

                        col.Item().PaddingTop(12).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        col.Item().PaddingTop(4).AlignCenter()
                            .Text($"Tra cứu hóa đơn tại hệ thống. Mã hóa đơn: {hd.MaHD}")
                            .FontSize(7).FontColor(Colors.Grey.Darken1).Italic();
                    });
                });
            });

            return doc.GeneratePdf();
        }

        public async Task SendInvoiceEmailAsync(int hoaDonId)
        {
            var hd = await _ctx.HoaDons.FindAsync(hoaDonId);
            if (hd == null) throw new Exception("Không tìm thấy hóa đơn.");
            if (!hd.YeuCauVat) throw new Exception("Đơn hàng không yêu cầu hóa đơn GTGT.");

            string? emailTo = hd.VatEmail;
            if (string.IsNullOrEmpty(emailTo)) throw new Exception("Đơn hàng không có địa chỉ email để gửi hóa đơn.");

            byte[] pdf = await GeneratePdfAsync(hoaDonId);

            string subject = $"Hóa đơn GTGT - Đơn hàng {hd.MaHD}";
            string body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px 8px 0 0;'>
                        <h2 style='color: white; margin: 0;'>🧾 Hóa đơn GTGT điện tử</h2>
                    </div>
                    <div style='background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;'>
                        <p>Kính gửi Quý khách,</p>
                        <p>Hóa đơn GTGT cho đơn hàng <strong>{hd.MaHD}</strong> đã được đính kèm trong email này.</p>
                        <table style='width: 100%; border-collapse: collapse; margin: 16px 0;'>
                            <tr style='background: #f5f5f5;'>
                                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Mã đơn hàng</td>
                                <td style='padding: 8px; border: 1px solid #ddd;'>{hd.MaHD}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Ngày lập</td>
                                <td style='padding: 8px; border: 1px solid #ddd;'>{hd.NgayLap:dd/MM/yyyy}</td>
                            </tr>
                            <tr style='background: #f5f5f5;'>
                                <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Tổng tiền</td>
                                <td style='padding: 8px; border: 1px solid #ddd; color: #e53935; font-weight: bold;'>{hd.TongTien:N0} VNĐ</td>
                            </tr>
                        </table>
                        <p>Vui lòng kiểm tra file PDF đính kèm để xem chi tiết hóa đơn.</p>
                        <p style='color: #888; font-size: 12px;'>Đây là email tự động từ hệ thống. Vui lòng không trả lời email này.</p>
                    </div>
                </div>";

            await _emailService.SendEmailAsync(emailTo, subject, body, pdf, $"HoaDon_GTGT_{hd.MaHD}.pdf");
        }

        // ---- Utility: Chuyển số thành chữ tiếng Việt ----
        private static string NumberToText(decimal number)
        {
            if (number == 0) return "Không đồng";

            string[] dvDon = { "", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };
            string[] dvHang = { "", "nghìn", "triệu", "tỷ" };

            long n = (long)Math.Round(number);
            if (n < 0) return "âm " + NumberToText((decimal)(-n));

            var parts = new List<int>();
            while (n > 0) { parts.Add((int)(n % 1000)); n /= 1000; }

            var result = new List<string>();
            for (int i = parts.Count - 1; i >= 0; i--)
            {
                if (parts[i] == 0) continue;
                string s = ReadThreeDigits(parts[i], dvDon);
                if (!string.IsNullOrEmpty(dvHang[i]))
                    s += " " + dvHang[i];
                result.Add(s);
            }

            string text = string.Join(" ", result);
            text = char.ToUpper(text[0]) + text[1..];
            return text + " đồng chẵn";
        }

        private static string ReadThreeDigits(int n, string[] dvDon)
        {
            int tram = n / 100;
            int chuc = (n % 100) / 10;
            int donvi = n % 10;
            var sb = new System.Text.StringBuilder();

            if (tram > 0) sb.Append(dvDon[tram] + " trăm");
            if (chuc == 0 && donvi > 0 && tram > 0) sb.Append(" lẻ " + dvDon[donvi]);
            else if (chuc == 1) { sb.Append(" mười"); if (donvi > 0) sb.Append(" " + dvDon[donvi]); }
            else if (chuc > 1) { sb.Append(" " + dvDon[chuc] + " mươi"); if (donvi == 1) sb.Append(" mốt"); else if (donvi > 1) sb.Append(" " + dvDon[donvi]); }
            else if (chuc == 0 && donvi > 0 && tram == 0) sb.Append(dvDon[donvi]);

            return sb.ToString().Trim();
        }
    }

    public class VatLineItem
    {
        public string TenHangHoa { get; set; } = "";
        public string DonViTinh { get; set; } = "";
        public int SoLuong { get; set; }
        public decimal DonGiaChietKhau { get; set; }
        public decimal TienChietKhau { get; set; }
        public decimal ThanhTienTruocThue { get; set; }
        public decimal ThueSuat { get; set; }
        public decimal TienThueGTGT { get; set; }
    }
}
