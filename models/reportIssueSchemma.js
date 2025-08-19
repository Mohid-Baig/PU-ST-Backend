import mongoose from "mongoose";

const reportIssueSchemma = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Cleanliness', 'safety', 'enviornment', 'drainage', 'construction', 'broken_resources', 'other'],
        required: true,
        default: 'Cleanliness'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    photo: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'viewed', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminRemarks: {
        type: String,
        default: ''
    },
}, {
    timestamps: true
})

const ReportIssue = mongoose.model('ReportIssue', reportIssueSchemma);
export default ReportIssue;