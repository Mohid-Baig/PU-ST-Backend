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

        const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
        ;

        const transporter = nodemailer.createTransport({
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
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) return res.status(400).json({ message: "New password is required" });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).send(`
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
              <h2 style="color:green;">✅ Password reset successful! You can now log in.</h2>
            </div>
          `);

    } catch (error) {
        console.error("Reset password error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
