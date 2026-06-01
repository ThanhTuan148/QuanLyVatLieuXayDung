using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterialAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVaiTroModuleQuyen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SoLuongDaGiao",
                table: "CTHD",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BANNER",
                columns: table => new
                {
                    MaBanner = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Desc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Src = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bg = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Panel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BANNER", x => x.MaBanner);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SenderRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReplyMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RepliedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TEAM_MEMBER",
                columns: table => new
                {
                    MaThanhVien = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StudentId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Avatar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bg = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TEAM_MEMBER", x => x.MaThanhVien);
                });

            migrationBuilder.CreateTable(
                name: "VAITRO_MODULE_QUYEN",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaVaiTro = table.Column<int>(type: "int", nullable: false),
                    Module = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenModule = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoTheXem = table.Column<bool>(type: "bit", nullable: false),
                    CoTheTao = table.Column<bool>(type: "bit", nullable: false),
                    CoTheSua = table.Column<bool>(type: "bit", nullable: false),
                    CoTheXoa = table.Column<bool>(type: "bit", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VAITRO_MODULE_QUYEN", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VAITRO_MODULE_QUYEN_VAITRO_MaVaiTro",
                        column: x => x.MaVaiTro,
                        principalTable: "VAITRO",
                        principalColumn: "MaVaiTro",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VAITRO_MODULE_QUYEN_MaVaiTro",
                table: "VAITRO_MODULE_QUYEN",
                column: "MaVaiTro");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BANNER");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropTable(
                name: "TEAM_MEMBER");

            migrationBuilder.DropTable(
                name: "VAITRO_MODULE_QUYEN");

            migrationBuilder.DropColumn(
                name: "SoLuongDaGiao",
                table: "CTHD");
        }
    }
}
