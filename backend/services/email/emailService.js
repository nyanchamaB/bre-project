import transporter from './emailTransporter.js';
import { emailTemplates } from './emailTemplates.js';

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendAppointmentEmail = async (type, appointment) => {
  const template = emailTemplates[type](appointment);
  return sendEmail(appointment.student.email, template.subject, template.html);
};