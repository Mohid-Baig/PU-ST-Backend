import mongoose from "mongoose";

const eventNotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sendEmail: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const EventNotification = mongoose.model("EventNotification", eventNotificationSchema);
export default EventNotification;
