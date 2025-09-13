import express from 'express';
import { RegisterUser, loginUser, getMyProfile, verifyEmail, logoutUser, updateProfile } from '../controllers/UserController.js';
import { refreshAccessToken } from '../controllers/auth.js';
import upload from '../middleware/upload.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user-related routes
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               uniId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               uniCardImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post(
    '/register',
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'uniCardImage', maxCount: 1 },
    ]),
    RegisterUser
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', verifyToken, getMyProfile);

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: The user's updated full name.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's updated email address.
 *               uniId:
 *                 type: string
 *                 description: The user's updated university ID.
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: The user's new profile picture.
 *               uniCardImage:
 *                 type: string
 *                 format: binary
 *                 description: The user's new university card image.
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request (e.g., validation error)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 */
router.put(
    '/update-profile',
    verifyToken,
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'uniCardImage', maxCount: 1 },
    ]),
    updateProfile
);


/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', verifyEmail);
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       400:
 *         description: Missing or invalid refresh token
 *       403:
 *         description: Refresh token expired or not found
 */
router.post('/refresh', refreshAccessToken);
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and remove refresh token from database
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

router.post('/logout', verifyToken, logoutUser);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset user password using a token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password/:token", resetPassword);
router.get("/reset-password/:token", (req, res) => {
    const { token } = req.params;

    try {
        jwt.verify(token, process.env.JWT_RESET_SECRET);

        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password - Uni Smart Tracker</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f0f2f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background-color: #ffffff;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    width: 100%;
                    text-align: center;
                }
                h2 {
                    color: #1c1e21;
                    margin-bottom: 20px;
                    font-size: 24px;
                }
                p {
                    color: #606770;
                    margin-bottom: 20px;
                    font-size: 16px;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                label {
                    text-align: left;
                    font-weight: 600;
                    color: #1c1e21;
                }
                input[type="password"] {
                    width: 90%;
                    padding: 12px 10px;
                    border: 1px solid #dddfe2;
                    border-radius: 6px;
                    font-size: 16px;
                }
                button {
                    background-color: #1877f2;
                    color: #ffffff;
                    font-size: 18px;
                    font-weight: 700;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #166fe5;
                }
                .error-message {
                    color: #fa383e;
                    margin-top: 10px;
                    display: none;
                    font-size: 14px;
                    text-align: left;
                }
                .expired-link {
                    text-align: center;
                    color: #fa383e;
                    font-size: 18px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Reset Your Password</h2>
                <p>Enter and confirm your new password below.</p>
                <form id="resetForm" action="/api/auth/reset-password/${token}" method="POST">
                    <label for="newPassword">New Password:</label>
                    <input type="password" id="newPassword" name="newPassword" required minlength="6" placeholder="Enter new password">
                    <span id="passwordError" class="error-message">Password must be at least 6 characters.</span>
                    <button type="submit">Reset Password</button>
                </form>
            </div>
            
            <script>
                const form = document.getElementById('resetForm');
                const passwordInput = document.getElementById('newPassword');
                const passwordError = document.getElementById('passwordError');
  
                form.addEventListener('submit', function(e) {
                    if (passwordInput.value.length < 6) {
                        e.preventDefault();
                        passwordError.style.display = 'block';
                        passwordInput.focus();
                    } else {
                        passwordError.style.display = 'none';
                    }
                });
            </script>
        </body>
        </html>
      `);

    } catch (err) {
        res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h3 style="color: #fa383e;">Error</h3>
            <p style="color: #606770;">This reset link is invalid or has expired.</p>
            <p style="color: #606770;">Please request a new password reset link.</p>
        </div>
      `);
    }
});




export default router;