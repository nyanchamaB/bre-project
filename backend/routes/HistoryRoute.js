import History from "../models/History.js";
import { protect, authorize } from "../middleware/auth.js";
import express from "express";          
import mongoose from "mongoose";
const router = express.Router();

router.get("/view", protect, authorize("lecturer", "student"), async (req, res) => {    
  try {
    const history = await History.find({ user: req.user.id });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
});

router.post("/create", protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newHistory = new History({
      user: req.user.id,
      title,
      description,
    });
    await newHistory.save();
    res.status(201).json({ message: "History created successfully", history: newHistory });
  } catch (error) {
    res.status(500).json({ message: "Error creating history", error: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const history = await History.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ message: "History not found" });
    }
    history.title = title;
    history.description = description;
    await history.save();
    res.status(200).json({ message: "History updated successfully", history });
  } catch (error) {
    res.status(500).json({ message: "Error updating history", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {    
  try {
    const history = await History.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ message: "History not found" });
    }
    await history.remove();
    res.status(200).json({ message: "History deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting history", error: error.message });
  }
});

//different routes

router.get('/archives', async (req, res) => {
    try {
        const archives = await Archive.find();

        const analyticsData = archives.reduce((acc, archive) => {
            const date = archive.archivedAt.toISOString().split('T')[0];

            if (!acc[date]) {
                acc[date] = { date, archivedCount: 0, deletedCount: 0 };
            }

            acc[date].archivedCount++;

            if (archive.deletedAt) {
                acc[date].deletedCount++;
            }

            return acc;
        }, {});

        res.json(Object.values(analyticsData));
    } catch (error) {
        res.status(500).json({ message: "Error fetching data", error });
    }
});

router.delete('/delete/archives', async (req, res) => {
    try {
        const { fileIds } = req.body; 
        await Archive.updateMany(
            { _id: { $in: fileIds } },
            { $set: { deletedAt: new Date() } }
        );
        res.json({ message: "Files marked as deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting files", error });
    }
});

export default router;