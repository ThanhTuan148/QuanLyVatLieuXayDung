using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;

namespace BuildingMaterialAPI.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null);
    }

    public class EmailSettings
    {
        public string SmtpServer { get; set; } = "";
        public int SmtpPort { get; set; }
        public string SenderName { get; set; } = "";
        public string SenderEmail { get; set; } = "";
        public string SenderPassword { get; set; } = "";
    }

    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = body };

            if (attachment != null && !string.IsNullOrEmpty(attachmentName))
            {
                builder.Attachments.Add(attachmentName, attachment);
            }

            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_settings.SmtpServer, _settings.SmtpPort, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_settings.SenderEmail, _settings.SenderPassword);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
