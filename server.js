const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==========================================
// 1. MIDDLEWARES
// ==========================================
// Enable CORS so the React frontend (running on port 3000) can communicate with this backend (port 5000)
app.use(cors());

// Parse incoming JSON request bodies into req.body as JavaScript objects
app.use(express.json());

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tasktracker';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ [MongoDB] Connected successfully!'))
  .catch((err) => console.error('❌ [MongoDB] Connection error:', err.message));

// ==========================================
// 3. SCHEMA & MODEL DEFINITION
// ==========================================
// Define the shape of documents inside the MongoDB collection
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compile schema into a Mongoose model
const Task = mongoose.model('Task', taskSchema);

// ==========================================
// 4. API ROUTES (CRUD OPERATIONS)
// ==========================================

// 1. [READ ALL] GET /api/tasks - Fetch all tasks from MongoDB
app.get('/api/tasks', async (req, res) => {
  try {
    // Retrieve all tasks, sorted with newest first (createdAt: -1)
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// 2. [READ ONE] GET /api/tasks/:id - Fetch a single task by its MongoDB ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// 3. [CREATE] POST /api/tasks - Create and persist a new task in MongoDB
app.post('/api/tasks', async (req, res) => {
  try {
    // Extract task title from request payload
    const { title } = req.body;

    // Validation: Title must not be empty
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Instantiate new Mongoose document
    const newTask = new Task({
      title: title.trim()
    });

    // Save to MongoDB (asynchronous operation)
    const savedTask = await newTask.save();

    // Respond with 201 Created and the saved task
    res.status(201).json(savedTask);

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// 4. [UPDATE] PUT /api/tasks/:id - Update task title and/or completed status
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    // Build update object only with provided fields
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

    // findByIdAndUpdate: { new: true } returns the updated document instead of the original
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Respond with 200 OK and the updated task
    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// 5. [DELETE] DELETE /api/tasks/:id - Permanently remove a task from MongoDB
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    // findByIdAndDelete removes the matching document from MongoDB
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Respond with 200 OK and confirmation
    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ==========================================
// 5. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
