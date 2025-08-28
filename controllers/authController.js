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

        const transporter = nodemailer.createTransporter({
            service: "Gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.sendMail({
            to: user.email,
            subject: "Password Reset Request",
            html: `
        <h2>Password Reset</h2>
        <p>Click below link to reset your password (valid for 15 minutes):</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
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

    try {
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        await user.save();

        res.status(200).json({ message: "✅ Password reset successful. You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err.message);
        res.status(400).json({ message: "❌ Invalid or expired token" });
    }
};