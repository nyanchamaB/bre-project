import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  registration: (user) => ({
    subject: 'Welcome to Wikonnect',
    html: `
      <h1>Welcome to Wikonnect, ${user.fullName}!</h1>
      <p>Your account has been successfully created.</p>
      <p>Registration Number: ${user.regNumber}</p>
      <p>Please login to access your account.</p>
    `
  }),
  resetPassword: (resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
    `
  })
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};