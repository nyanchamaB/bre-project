export const emailTemplates = {
    appointmentConfirmation: (appointment) => ({
      subject: 'Wikonnect - Appointment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007bff;">Appointment Confirmation</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Lecturer:</strong> ${appointment.lecturer.fullName}</p>
            <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          <p>Please join the meeting on time.</p>
          <p>Best regards,<br>Wikonnect Team</p>
        </div>
      `
    }),
  
    appointmentReminder: (appointment) => ({
      subject: 'Wikonnect - Appointment Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ffc107;">Appointment Reminder</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Lecturer:</strong> ${appointment.lecturer.fullName}</p>
            <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
            <p><strong>Status:</strong> Scheduled</p>
          </div>
          <p>Your appointment is coming up soon.</p>
          <p>Best regards,<br>Wikonnect Team</p>
        </div>
      `
    }),
  
    appointmentCancellation: (appointment) => ({
      subject: 'Wikonnect - Appointment Cancelled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc3545;">Appointment Cancelled</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Lecturer:</strong> ${appointment.lecturer.fullName}</p>
            <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
            <p><strong>Status:</strong> Cancelled</p>
          </div>
          <p>You can book another appointment through the system.</p>
          <p>Best regards,<br>Wikonnect Team</p>
        </div>
      `
    }),
  
    slotCreation: (slot) => ({
      subject: 'Wikonnect - New Appointment Slot Available',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #28a745;">New Appointment Slot</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${new Date(slot.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
            <p><strong>Available Spots:</strong> ${slot.maxStudents}</p>
          </div>
          <p>Book your appointment now through the Wikonnect system.</p>
          <p>Best regards,<br>Wikonnect Team</p>
        </div>
      `
    })
  };