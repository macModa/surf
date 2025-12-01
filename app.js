const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());

// ============================
// 🔥 CORS FIX — 100% compatible Render
// ============================
app.use(cors({
    origin: "*",  // autorise toutes les origines (Flutter Web, mobile, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // PAS de cookies → doit rester false
    optionsSuccessStatus: 200
}));

// 🔥 Handler global OPTIONS obligatoire sur Render
app.options("*", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(200);
});

// ============================
// Tes routes ici
// ============================
const habitsRoutes = require("./routes/habits");
app.use("/habits", habitsRoutes);

// ============================
// Render port binding
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
}

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Habit Tracker API - Secure Edition',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            habits: '/habits (GET, POST, PUT, DELETE) - Requires Firebase token',
        },
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});

// Habit routes
app.use('/habits', habitRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);

    const message =
        process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message;

    res.status(err.status || 500).json({
        success: false,
        error: 'Server error',
        message,
    });
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 Habit Tracker API - Secure Edition   ║
║                                            ║
║   Port:        ${PORT.toString().padEnd(30)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║   MongoDB:     ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Pending...'}║
║                                            ║
║   🔐 Firebase Auth: Enabled                ║
║   🛡️  Security:      Helmet + Rate Limit   ║
╚════════════════════════════════════════════╝
`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    try {
        server.close(() => {
            console.log('✅ HTTP server closed');
        });

        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }

    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
