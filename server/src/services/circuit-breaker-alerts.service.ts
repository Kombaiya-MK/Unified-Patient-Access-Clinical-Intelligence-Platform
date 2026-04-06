/**
 * Circuit Breaker Alert Service
 *
 * Sends email (nodemailer) and optional SMS notifications when an AI
 * circuit breaker opens or recovers.
 *
 * @module services/circuit-breaker-alerts.service
 * @task US_041 TASK_001
 */
import nodemailer from 'nodemailer';
import config from '../config/env';
import logger from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.email) return null;

  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465,
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPassword,
    },
  });
  return transporter;
}

export async function sendCircuitBreakerAlert(
  breakerName: string,
  state: 'open' | 'recovered',
): Promise<void> {
  const isOpen = state === 'open';
  const subject = isOpen
    ? `CRITICAL: ${breakerName} circuit breaker opened`
    : `RECOVERED: ${breakerName} circuit breaker closed`;
  const body = isOpen
    ? `The ${breakerName} circuit breaker has opened due to a high failure rate (>50 %). AI service is operating in fallback mode.`
    : `The ${breakerName} circuit breaker has recovered. AI service is back online.`;

  // Email
  const mailer = getTransporter();
  if (mailer && config.email) {
    try {
      await mailer.sendMail({
        from: config.email.smtpFrom,
        to: process.env.ADMIN_EMAIL || config.email.smtpFrom,
        subject,
        text: `${body}\n\nTimestamp: ${new Date().toISOString()}`,
        html: `<h2>${subject}</h2><p>${body}</p><p><small>Timestamp: ${new Date().toISOString()}</small></p>`,
      });
      logger.info(`Circuit breaker alert email sent: ${subject}`);
    } catch (err) {
      logger.error('Failed to send circuit breaker alert email', err);
    }
  }

  // SMS via Twilio (optional)
  if (config.twilio && process.env.ADMIN_PHONE) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: process.env.ADMIN_PHONE,
          From: config.twilio.phoneNumber,
          Body: `${subject}: ${body}`,
        }).toString(),
      });
      logger.info(`Circuit breaker alert SMS sent to ${process.env.ADMIN_PHONE}`);
    } catch (err) {
      logger.error('Failed to send circuit breaker alert SMS', err);
    }
  }
}
