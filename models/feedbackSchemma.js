import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['suggestion', 'complaint', 'appreciation', 'teacher_absentee', 'other'],
        required: true,
        default: 'suggestion'
    },
    location: {
        type: String,
        trim: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    //   status: {
    //     type: String,
    //     enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    //     default: 'pending'
    //   },
    //   adminRemarks: {
    //     type: String,
    //     default: ''
    //   },
    //   isAnonymous: {
    //     type: Boolean,
    //     default: false
    //   }
}, {
    timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
