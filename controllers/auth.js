import User from "../models/userSchemma.js";
import jwt from "jsonwebtoken";

export const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("Refresh Error:", error.message);
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};
