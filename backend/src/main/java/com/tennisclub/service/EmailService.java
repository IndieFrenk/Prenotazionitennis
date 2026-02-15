package com.tennisclub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tennisclub.dto.ContactFormRequest;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

/**
 * Service responsible for sending emails from the application.
 * Handles contact form submissions and password reset notifications.
 * Uses Resend HTTP API for email delivery in production.
 * Email failures are logged but never propagated to callers, so that
 * the main business flow is not interrupted by mail issues.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.email.from:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    /**
     * Sends an email to the club address containing a contact form submission.
     */
    public void sendContactFormEmail(ContactFormRequest request) {
        String safeName = Jsoup.clean(request.name(), Safelist.none());
        String subject = "Nuovo messaggio dal modulo di contatto - " + safeName;
        String body = buildContactFormBody(request);
        sendHtmlEmail(fromEmail, subject, body);
    }

    /**
     * Sends a password reset email containing a link with the reset token.
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
                """.formatted(Jsoup.clean(resetToken, Safelist.none()));
        sendHtmlEmail(toEmail, subject, body);
    }

    private String buildContactFormBody(ContactFormRequest request) {
        String safeName = Jsoup.clean(request.name(), Safelist.none());
        String safeEmail = Jsoup.clean(request.email(), Safelist.none());
        String safeMessage = Jsoup.clean(request.message(), Safelist.none());
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
                """.formatted(safeName, safeEmail, safeMessage);
    }

    /**
     * Sends an HTML email via Resend HTTP API using Jackson for JSON serialization.
     */
    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not configured, skipping email to {}", to);
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                    "from", fromEmail,
                    "to", List.of(to),
                    "subject", subject,
                    "html", htmlBody
            );
            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                log.info("Email sent via Resend to: {}", to);
            } else {
                log.error("Resend API error ({}): {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
