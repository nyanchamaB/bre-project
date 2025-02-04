import Appointment from '../models/Appointment.js';
import { sendEmail } from '../utils/emailService.js';

export const createAppointment = async (req, res) => {
  try {
    const { lecturerId, date, time, reason } = req.body;
    
    const appointment = await Appointment.create({
      student: req.user.id,
      lecturer: lecturerId,
      date,
      time,
      reason
    });

    // Send confirmation email
    await sendEmail(req.user.email, 'appointmentCreated', appointment);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      [req.user.role === 'student' ? 'student' : 'lecturer']: req.user.id
    }).populate('student lecturer', 'fullName email');
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};