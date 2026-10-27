const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tasktracker';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to ${MONGO_URI}`);
  } catch (err) {
    console.error('[MongoDB] Initial connection error:', err.message);
    console.log('[MongoDB] Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected successfully');
});

// Start DB connection
connectDB();

// Task Schema & Model
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// Middleware to check DB connection state
const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is not connected. Please ensure MongoDB is running and try again.'
    });
  }
  next();
};

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const status = states[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    database: status,
    timestamp: new Date().toISOString()
  });
});

// 1. GET /api/tasks (List tasks with pagination, filtering, search)
app.get('/api/tasks', requireDB, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'all', 'active', 'completed'
    const search = req.query.search ? req.query.search.trim() : '';

    const query = {};
    if (filter === 'active') {
      query.completed = false;
    } else if (filter === 'completed') {
      query.completed = true;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const [totalTasks, allCount, activeCount, completedCount, tasks] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments(),
      Task.countDocuments({ completed: false }),
      Task.countDocuments({ completed: true }),
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.max(1, Math.ceil(totalTasks / limit));

    res.status(200).json({
      tasks,
      pagination: {
        totalTasks,
        totalPages,
        currentPage: page,
        limit
      },
      stats: {
        total: allCount,
        active: activeCount,
        completed: completedCount
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error fetching tasks: ' + error.message });
  }
});

// 2. POST /api/tasks (Create a new task)
app.post('/api/tasks', requireDB, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const newTask = new Task({ title: title.trim() });
    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task: ' + error.message });
  }
});

// 3. PATCH /api/tasks/:id (Update task status or title)
app.patch('/api/tasks/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    const updates = {};
    if (typeof completed === 'boolean') {
      updates.completed = completed;
    }
    if (typeof title === 'string') {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Task title cannot be blank' });
      }
      updates.title = title.trim();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Error updating task: ' + error.message });
  }
});

// 4. DELETE /api/tasks/:id (Delete a task)
app.delete('/api/tasks/:id', requireDB, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Task ID format' });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({ message: 'Error deleting task: ' + error.message });
  }
});

// Catch-all route for 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));