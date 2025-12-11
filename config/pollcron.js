import Poll from "../models/pollsVoteScheema.js";
export const autoCloseExpiredPolls = async () => {
    try {
        await Poll.updateMany(
            { expiresAt: { $lt: new Date() }, isActive: true },
            { $set: { isActive: false } }
        );
    } catch (error) {
        console.error("Poll expiry cron error:", error);
    }
};