const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.MongoStore || connectMongo;
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// ==========================================
// 1. ENVIRONMENT CONFIGURATION
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tasktracker';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_key_change_in_production';

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ [MongoDB] Connected successfully to:', MONGO_URI))
  .catch((err) => console.error('❌ [MongoDB] Connection error:', err.message));

// ==========================================
// 3. MIDDLEWARES & CORS
// ==========================================
// Allow React frontend origin with credentials (cookies)
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ==========================================
// 4. SESSION-BASED AUTHENTICATION (MongoStore)
// ==========================================
app.use(session({
  name: 'connect.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    httpOnly: true, // Prevents client-side scripts from reading cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // true in HTTPS production, false in local dev
    sameSite: 'lax', // CSRF mitigation while supporting standard client-origin navigation
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days in milliseconds
  },
}));

// ==========================================
// 5. API ROUTES
// ==========================================
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', serverTime: new Date() });
});

// Authentication routes (register, login, logout, current-user)
app.use('/api/auth', authRoutes);

// Protected task management routes
app.use('/api/tasks', taskRoutes);

// Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Requested endpoint not found' });
});

// ==========================================
// 6. SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Session-based authentication enabled (Storage: MongoDB)`);
  console.log(`🌐 Accepting requests from: ${CLIENT_URL}`);
});
