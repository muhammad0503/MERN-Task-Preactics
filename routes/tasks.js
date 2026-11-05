const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');

// Protect all task endpoints: User must have an active session
router.use(requireAuth);

// ==============================================================
// 1. [GET] /api/tasks - Retrieve ONLY the authenticated user's tasks
// ==============================================================
router.get('/', async (req, res) => {
  try {
    // Strict ownership enforcement: filter by user ID from session
    const tasks = await Task.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ==============================================================
// 2. [GET] /api/tasks/:id - Retrieve a single task owned by user
// ==============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    // Must match both task ID and session user ID
    const task = await Task.findOne({ _id: id, user: req.session.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access unauthorized' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Fetch single task error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ==============================================================
// 3. [POST] /api/tasks - Create task linked to the authenticated user
// ==============================================================
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Attach current user's session ID to establish ownership
    const newTask = new Task({
      title: title.trim(),
      user: req.session.userId,
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ==============================================================
// 4. [PUT] /api/tasks/:id - Update a task owned by the user
// ==============================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    const updateData = {};
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Task title cannot be empty' });
      }
      updateData.title = title.trim();
    }
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }

    // Server-enforced ownership: user cannot update another user's task
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.session.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or access unauthorized' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ==============================================================
// 5. [DELETE] /api/tasks/:id - Delete a task owned by the user
// ==============================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    // Server-enforced ownership: user cannot delete another user's task
    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      user: req.session.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found or access unauthorized' });
    }

    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask,
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;

