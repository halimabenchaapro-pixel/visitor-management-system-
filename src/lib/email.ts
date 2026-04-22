import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!process.env.SMTP_USER) return;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@company.com",
    to,
    subject,
    html,
  });
}

export function buildInvitationEmail(params: {
  visitorName: string;
  hostName: string;
  companyName: string;
  scheduledDate: string;
  location: string;
  token: string;
  baseUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563EB; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Visit Invitation</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p>Dear <strong>${params.visitorName}</strong>,</p>
        <p>You have been invited to visit <strong>${params.companyName}</strong> by <strong>${params.hostName}</strong>.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> ${params.scheduledDate}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${params.location}</p>
          <p style="margin: 4px 0;"><strong>Host:</strong> ${params.hostName}</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${params.baseUrl}/invitation/${params.token}"
             style="background: #2563EB; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This invitation link will expire after use.</p>
      </div>
    </div>
  `;
}

export function buildCheckInNotificationEmail(params: {
  hostName: string;
  visitorName: string;
  visitorCompany: string;
  checkInTime: string;
  location: string;
  badgeNumber: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Visitor Has Arrived</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p>Hello <strong>${params.hostName}</strong>,</p>
        <p><strong>${params.visitorName}</strong> from <strong>${params.visitorCompany}</strong> has checked in and is waiting for you.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Check-in Time:</strong> ${params.checkInTime}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${params.location}</p>
          <p style="margin: 4px 0;"><strong>Badge #:</strong> ${params.badgeNumber}</p>
        </div>
      </div>
    </div>
  `;
}
