using System;
using System.Text;

namespace BuildingMaterialAPI.Utilities
{
    public static class NumberToText
    {
        private static string[] chuSo = { "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };
        private static string[] donVi = { "", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ" };

        public static string Convert(decimal number)
        {
            if (number == 0) return "Không đồng";
            if (number < 0) return "Âm " + Convert(Math.Abs(number));

            string sNumber = Math.Floor(number).ToString();
            int len = sNumber.Length;
            int pos = 0;
            StringBuilder result = new StringBuilder();
            
            // Chia chuỗi thành các nhóm 3 chữ số từ phải sang trái
            int numGroups = (len + 2) / 3;
            string[] groups = new string[numGroups];
            for (int i = 0; i < numGroups; i++)
            {
                int groupLen = (i == numGroups - 1) ? (len % 3 == 0 ? 3 : len % 3) : 3;
                groups[numGroups - 1 - i] = sNumber.Substring(pos, groupLen);
                pos += groupLen;
            }

            for (int i = numGroups - 1; i >= 0; i--)
            {
                string groupText = ConvertGroup(groups[i], i == numGroups - 1);
                if (!string.IsNullOrEmpty(groupText))
                {
                    result.Append(groupText);
                    result.Append(" ");
                    result.Append(donVi[i]);
                    result.Append(" ");
                }
            }

            string final = result.ToString().Trim();
            if (string.IsNullOrEmpty(final)) return "Không đồng";
            
            // Viết hoa chữ cái đầu
            final = char.ToUpper(final[0]) + final.Substring(1);
            return final + " đồng chẵn.";
        }

        private static string ConvertGroup(string group, bool isFirstGroup)
        {
            int n = int.Parse(group);
            if (n == 0 && !isFirstGroup) return "";

            int tram = n / 100;
            int chuc = (n % 100) / 10;
            int donViLe = n % 10;

            StringBuilder sb = new StringBuilder();

            // Hàng trăm
            if (!isFirstGroup || tram > 0)
            {
                sb.Append(chuSo[tram]);
                sb.Append(" trăm ");
            }

            // Hàng chục
            if (chuc > 1)
            {
                sb.Append(chuSo[chuc]);
                sb.Append(" mươi ");
            }
            else if (chuc == 1)
            {
                sb.Append("mười ");
            }
            else if (tram > 0 && donViLe > 0)
            {
                sb.Append("lẻ ");
            }

            // Hàng đơn vị
            if (donViLe > 0)
            {
                if (chuc > 0 && donViLe == 5) sb.Append("lăm");
                else if (chuc > 1 && donViLe == 1) sb.Append("mốt");
                else if (chuc == 0 && tram == 0 && donViLe == 0) { /* nothing */ }
                else sb.Append(chuSo[donViLe]);
            }
            else if (chuc == 0 && tram == 0 && donViLe == 0 && !isFirstGroup)
            {
                // return nothing
            }

            return sb.ToString().Trim();
        }
    }
}
