app.use(cors({
    origin: [
        "http://localhost:64134",  // Flutter Web debug
        "http://localhost:3000",
        "http://127.0.0.1:64134",
        "https://server-6tf0.onrender.com", // frontend hébergé
        "*" 
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

app.options("*", cors());
// ============================================
// Habit Routes - Secure CRUD Operations
// All routes are protected with Firebase authentication
// ============================================

const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const verifyFirebaseToken = require('../middleware/auth');

// Apply authentication middleware to ALL routes
router.use(verifyFirebaseToken);

// ============================================
// CREATE - Create a new habit
// POST /habits
// ============================================
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Habit name is required and must be a non-empty string',
            });
        }

        // Create habit with userId from authenticated token
        const habit = new Habit({
            userId: req.userId, // From auth middleware
            name: name.trim(),
        });

        await habit.save();

        console.log(`✅ Habit created: "${habit.name}" for user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Habit created successfully',
            data: habit.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error creating habit:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Failed to create habit',
        });
    }
});

// ============================================
// READ - Get all habits for authenticated user
// GET /habits
// ============================================
router.get('/', async (req, res) => {
    try {
        // Only return habits belonging to the authenticated user
        const habits = await Habit.find({ userId: req.userId })
            .sort({ createdAt: -1 }); // Most recent first

        console.log(`📋 Found ${habits.length} habits for user: ${req.userId}`);

        res.json({
            success: true,
            count: habits.length,
            data: habits.map((h) => h.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error fetching habits:', error);

        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Failed to fetch habits',
        });
    }
});

// ============================================
// UPDATE - Update a habit
// PUT /habits/:id
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Habit name is required and must be a non-empty string',
            });
        }

        // SECURITY: Find and update only if the habit belongs to the authenticated user
        const habit = await Habit.findOneAndUpdate(
            { _id: id, userId: req.userId }, // Must match both _id AND userId
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                error: 'Not found',
                message: 'Habit not found or you do not have permission to update it',
            });
        }

        console.log(`✏️  Habit updated: "${habit.name}" by user: ${req.userId}`);

        res.json({
            success: true,
            message: 'Habit updated successfully',
            data: habit.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error updating habit:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                message: 'The provided habit ID is invalid',
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Failed to update habit',
        });
    }
});

// ============================================
// DELETE - Delete a habit
// DELETE /habits/:id
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // SECURITY: Find and delete only if the habit belongs to the authenticated user
        const habit = await Habit.findOneAndDelete({
            _id: id,
            userId: req.userId, // Must match both _id AND userId
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                error: 'Not found',
                message: 'Habit not found or you do not have permission to delete it',
            });
        }

        console.log(`🗑️  Habit deleted: "${habit.name}" by user: ${req.userId}`);

        res.json({
            success: true,
            message: 'Habit deleted successfully',
            data: habit.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error deleting habit:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                message: 'The provided habit ID is invalid',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Failed to delete habit',
        });
    }
});

module.exports = router;
