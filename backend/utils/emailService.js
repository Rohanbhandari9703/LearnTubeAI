import nodemailer from "nodemailer";

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  // For development, use Gmail with app password or configure SMTP
  // For production, use a proper email service like SendGrid, Mailgun, etc.
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });

  return transporter;
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("⚠️ Email credentials not configured. OTP:", otp);
      // In development, you might want to log OTP instead of sending email
      return { success: true, otp }; // Return OTP for development
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "LearnTube AI - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">LearnTube AI - Email Verification</h2>
          <p>Thank you for signing up! Please verify your email address using the OTP below:</p>
          <div style="background-color: #1e293b; color: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
    throw new Error("Failed to send OTP email: " + error.message);
  }
};

export default { sendOTPEmail };
