import Slot from "../models/Slot.js";
import User from "../models/User.js";
import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";
  

const router = express.Router();

// Create a new time slot
router.post('/create', protect, async (req, res) => {
  try {
    const { date, location, startTime, endTime, maxStudents } = req.body;
    const userId = req.user._id; 

    const newSlot = new Slot({
      userId: req.user.id,
      date: new Date(date), // Ensure the date is parsed correctly
      location,
      startTime,
      endTime,
      maxStudents,
      status: 'available',
    });

    await newSlot.save();
    res.status(201).json({ message: 'Slot created successfully', slot: newSlot });
  } catch (error) {
    res.status(500).json({ message: 'Error creating slot', error: error.message });
  }
});


// Get all slots for a lecturer
router.get('/view/slots', protect, async (req, res) => {
  try {
    const { userId } = req.query; // Optional filter by lecturer ID

    let query = {};
    if (userId) {
      query.userId = userId; // Filter slots by lecturer
    }

    const slots = await Slot.find(query).populate('userId', 'email name'); // Populate lecturer details
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots', error: error.message });
  }
});

router.put('/update/:id', protect, async (req, res) => {
  try {
    const slotId = req.params.id;
    const { day, location, startTime, endTime, maxStudents } = req.body;

    // Find the slot by ID and ensure the logged-in user owns it
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this slot' });
    }

    // Update slot details
    slot.day = day || slot.day;
    slot.location = location || slot.location;
    slot.startTime = startTime || slot.startTime;
    slot.endTime = endTime || slot.endTime;
    slot.maxStudents = maxStudents || slot.maxStudents;

    await slot.save();
    res.status(200).json({ message: 'Slot updated successfully', slot });
  } catch (error) {
    res.status(500).json({ message: 'Error updating slot', error: error.message });
  }
});

router.delete('/delete/:id', protect, async (req, res) => {
  try {
    const slotId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({ message: "Invalid Slot ID format" });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (!slot.userId || slot.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this slot' });
    }

    await Slot.findByIdAndDelete(slotId);
    res.status(200).json({ message: 'Slot deleted successfully' });

  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ message: 'Error deleting slot', error: error.message });
  }
});


router.get('/all', protect, async (req, res) => {
  try {
    const slots = await Slot.find().populate('userId', 'email name'); 
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots', error: error.message });
  }
});

router.get("/student/view", async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Lecturer userId is required" });
    }

    let query = { userId };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.date = { $gte: startDate, $lte: endDate };
    }

    const slots = await Slot.find(query);
    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});


export default router;
  