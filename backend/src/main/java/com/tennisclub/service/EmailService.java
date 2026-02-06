package com.tennisclub.service;

import com.tennisclub.dto.ContactFormRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service responsible for sending emails from the application.
 * Handles contact form submissions and password reset notifications.
 * Email failures are logged but never propagated to callers, so that
 * the main business flow is not interrupted by mail issues.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    /**
     * Sends an email to the club address containing a contact form submission.
     * The sender's name and email are included in the message body.
     *
     * @param request the contact form request containing name, email, and message
     */
    public void sendContactFormEmail(ContactFormRequest request) {
        String subject = "Nuovo messaggio dal modulo di contatto - " + request.name();
        String body = buildContactFormBody(request);
        sendHtmlEmail(fromEmail, subject, body);
    }

    /**
     * Sends a password reset email containing a link with the reset token.
     *
     * @param toEmail    the recipient email address
     * @param resetToken the password reset token to embed in the link
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String subject = "Tennis Club - Recupero password";
        String body = """
                <html>
                <body>
                    <h2>Recupero Password</h2>
                    <p>Hai richiesto il recupero della password per il tuo account.</p>
                    <p>Utilizza il seguente codice per reimpostare la tua password:</p>
                    <p style="font-size: 18px; font-weight: bold; color: #2c5f2d;">%s</p>
                    <p>Il codice scade tra 1 ora.</p>
                    <p>Se non hai richiesto il recupero della password, ignora questa email.</p>
                    <br/>
                    <p>Tennis Club</p>
                </body>
                </html>
                """.formatted(resetToken);
        sendHtmlEmail(toEmail, subject, body);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Builds the HTML body for a contact form email.
     */
    private String buildContactFormBody(ContactFormRequest request) {
        return """
                <html>
                <body>
                    <h2>Nuovo messaggio dal modulo di contatto</h2>
                    <p><strong>Nome:</strong> %s</p>
                    <p><strong>Email:</strong> %s</p>
                    <p><strong>Messaggio:</strong></p>
                    <p>%s</p>
                </body>
                </html>
                """.formatted(request.name(), request.email(), request.message());
    }

    /**
     * Creates and sends an HTML MimeMessage. Catches and logs any mail-related
     * exceptions without re-throwing, ensuring that email failures do not
     * break the calling business flow.
     *
     * @param to      the recipient email address
     * @param subject the email subject line
     * @param body    the HTML body content
     */
    private void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
