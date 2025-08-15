import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    votes: {
        type: Number,
        default: 0
    }
}, { _id: false });

function arrayLimit(val) {
    return val.length >= 2;
}

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [optionSchema],
        validate: [arrayLimit, '{PATH} must have at least 2 options']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    votedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    totalVotes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional auto-delete if TTL used

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
