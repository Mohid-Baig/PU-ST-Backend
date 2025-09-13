import User from "../models/userSchemma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_RESET_SECRET,
            { expiresIn: "15m" }
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.sendMail({
            to: user.email,
            from: `"PU Smart Tracker App" <${process.env.SMTP_EMAIL}>`,
            subject: "Reset Your Password - PU Smart Tracker App",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p style="font-size: 16px; color: #555;">
                    We received a request to reset your password for your <b>PU Smart Tracker App</b> account.
                </p>
                <p style="font-size: 16px; color: #555;">
                    Click the button below to set a new password. This link is valid for <b>15 minutes</b>.
                </p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" target="_blank" 
                        style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p style="font-size: 14px; color: #888;">
                    If the button above doesn't work, copy and paste this link into your browser:
                    <br />
                    <a href="${resetUrl}" target="_blank" style="color: #007bff;">${resetUrl}</a>
                </p>
                <p style="font-size: 14px; color: #aaa; margin-top: 40px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
            `,
        });

        return res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    console.log("🔧 Reset Password Attempt:");
    console.log("Token:", token);
    console.log("New Password Received:", newPassword);

    try {
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        console.log("Decoded Token:", decoded);

        const user = await User.findById(decoded.id);
        if (!user) {
            console.log("❌ User not found with ID:", decoded.id);
            return res.status(404).send(`
                <html>
                    <head>
                        <title>Password Reset Failed</title>
                        <style>
                            body { font-family: Arial, sans-serif; background:#f9f9f9; text-align:center; padding:50px; }
                            .card { background:white; padding:40px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); display:inline-block; }
                            h1 { color:#e74c3c; }
                            p { color:#555; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>Password Reset Failed</h1>
                            <p>User not found.</p>
                        </div>
                    </body>
                </html>
            `);
        }

        console.log("👤 User Found:", user.email);

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        console.log("🔐 Hashed Password:", hashedPassword);

        await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

        console.log("✅ Password updated successfully for:", user.email);

        return res.status(200).send(`
            <html>
                <head>
                    <title>Password Reset Successful</title>
                    <style>
                        body { font-family: Arial, sans-serif; background:#f0f8ff; text-align:center; padding:50px; }
                        .card { background:white; padding:40px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); display:inline-block; }
                        h1 { color:#2ecc71; }
                        p { color:#333; margin-top:10px; }
                        a { display:inline-block; margin-top:20px; padding:10px 20px; background:#2ecc71; color:white; text-decoration:none; border-radius:6px; }
                        a:hover { background:#27ae60; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Password Reset Successful</h1>
                        <p>Your password has been updated. You can now log in with your new password.</p>
                    </div>
                </body>
            </html>
        `);

    } catch (err) {
        console.error("❌ Reset password error:", err.message);

        return res.status(400).send(`
            <html>
                <head>
                    <title>Invalid or Expired Token</title>
                    <style>
                        body { font-family: Arial, sans-serif; background:#f9f9f9; text-align:center; padding:50px; }
                        .card { background:white; padding:40px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); display:inline-block; }
                        h1 { color:#e67e22; }
                        p { color:#555; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>⚠️ Token Error</h1>
                        <p>The reset link is invalid or expired. Please request a new password reset.</p>
                    </div>
                </body>
            </html>
        `);
    }
};
