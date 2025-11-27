// ============================================
// Authentication Middleware
// Verifies Firebase ID tokens
// ============================================

const admin = require('../firebase');

/**
 * Authentication Middleware
 * 
 * Verifies the Firebase ID token from the Authorization header
 * and attaches the userId to the request object.
 * 
 * Expected header format:
 * Authorization: Bearer <firebase-id-token>
 * 
 * On success: req.userId is set to the Firebase UID
 * On failure: Returns 401 Unauthorized
 */

const verifyFirebaseToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header missing or invalid',
                message: 'Please provide a valid Firebase token',
            });
        }

        // Extract the token (remove "Bearer " prefix)
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token missing',
                message: 'Please provide a valid Firebase token',
            });
        }

        // Verify the token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Extract userId (Firebase UID) from decoded token
        req.userId = decodedToken.uid;
        req.userEmail = decodedToken.email;

        console.log(`✅ Authenticated user: ${req.userId} (${req.userEmail})`);

        // Continue to the next middleware/route handler
        next();
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);

        // Handle specific Firebase errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Your session has expired. Please login again.',
            });
        }

        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'The provided token is invalid.',
            });
        }

        // Generic authentication error
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: 'Could not verify your credentials. Please login again.',
        });
    }
};

module.exports = verifyFirebaseToken;
