using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class RestoreSupplierDebtsV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Thêm các cột cho CONGNO
            migrationBuilder.AddColumn<int>(
                name: "MaNhaCungCap",
                table: "CONGNO",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaPhieuNhap",
                table: "CONGNO",
                type: "int",
                nullable: true);

            // Thêm các cột cho CHITETTRANO
            migrationBuilder.AddColumn<int>(
                name: "MaPhieuNhap",
                table: "CHITETTRANO",
                type: "int",
                nullable: true);

            // Tạo Index
            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaNhaCungCap",
                table: "CONGNO",
                column: "MaNhaCungCap");

            migrationBuilder.CreateIndex(
                name: "IX_CONGNO_MaPhieuNhap",
                table: "CONGNO",
                column: "MaPhieuNhap");

            migrationBuilder.CreateIndex(
                name: "IX_CHITETTRANO_MaPhieuNhap",
                table: "CHITETTRANO",
                column: "MaPhieuNhap");

            // Thêm Foreign Key
            migrationBuilder.AddForeignKey(
                name: "FK_CONGNO_NHACUNGCAP_MaNhaCungCap",
                table: "CONGNO",
                column: "MaNhaCungCap",
                principalTable: "NHACUNGCAP",
                principalColumn: "MaNhaCungCap",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CONGNO_PHIEUNHAP_MaPhieuNhap",
                table: "CONGNO",
                column: "MaPhieuNhap",
                principalTable: "PHIEUNHAP",
                principalColumn: "MaPhieuNhap",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap",
                table: "CHITETTRANO",
                column: "MaPhieuNhap",
                principalTable: "PHIEUNHAP",
                principalColumn: "MaPhieuNhap",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(name: "FK_CONGNO_NHACUNGCAP_MaNhaCungCap", table: "CONGNO");
            migrationBuilder.DropForeignKey(name: "FK_CONGNO_PHIEUNHAP_MaPhieuNhap", table: "CONGNO");
            migrationBuilder.DropForeignKey(name: "FK_CHITETTRANO_PHIEUNHAP_MaPhieuNhap", table: "CHITETTRANO");

            migrationBuilder.DropIndex(name: "IX_CONGNO_MaNhaCungCap", table: "CONGNO");
            migrationBuilder.DropIndex(name: "IX_CONGNO_MaPhieuNhap", table: "CONGNO");
            migrationBuilder.DropIndex(name: "IX_CHITETTRANO_MaPhieuNhap", table: "CHITETTRANO");

            migrationBuilder.DropColumn(name: "MaNhaCungCap", table: "CONGNO");
            migrationBuilder.DropColumn(name: "MaPhieuNhap", table: "CONGNO");
            migrationBuilder.DropColumn(name: "MaPhieuNhap", table: "CHITETTRANO");
        }
    }
}
