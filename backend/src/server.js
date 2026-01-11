const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const swipeRoutes = require('./routes/swipe.routes');
const matchRoutes = require('./routes/match.routes');
const messageRoutes = require('./routes/message.routes');
const tripRoutes = require('./routes/trip.routes');
const blockRoutes = require('./routes/block.routes');
const reportRoutes = require('./routes/report.routes');
const verificationRoutes = require('./routes/verification.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewRoutes = require('./routes/review.routes');
const meetingRoutes = require('./routes/meeting.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { setupSocketHandlers } = require('./socket/socketHandlers');
const { createPubSubClients } = require('./config/redis');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { pubClient, subClient } = createPubSubClients();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.io Redis adapter enabled');
  } catch (error) {
    console.warn('⚠️ Socket.io Redis adapter not available:', error.message);
  }
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/emergency', emergencyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
setupSocketHandlers(io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
});
