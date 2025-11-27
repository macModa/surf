// ============================================
// Mongoose Model - Habit
// ============================================

const mongoose = require('mongoose');

/**
 * Habit Schema
 * 
 * Fields:
 * - userId: Firebase UID of the habit owner (required, indexed)
 * - name: Name of the habit (required, trimmed, validated)
 * - createdAt: Creation timestamp (auto-generated)
 * - updatedAt: Last update timestamp (auto-managed by timestamps: true)
 */

const habitSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, 'userId is required'],
            index: true, // Index for fast user-specific queries
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Habit name is required'],
            trim: true,
            minlength: [1, 'Habit name must be at least 1 character'],
            maxlength: [100, 'Habit name cannot exceed 100 characters'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt
        toJSON: {
            transform: (doc, ret) => {
                // Transform _id to id for API responses
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Compound index for efficient user-specific queries with sorting
habitSchema.index({ userId: 1, createdAt: -1 });

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
