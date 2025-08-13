import mongoose from 'mongoose';

const anonymousConfessionSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    replies: [
        {
            message: { type: String },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    isReported: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    reports: [ // optional
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reason: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const AnonymousConfession = mongoose.model('AnonymousConfession', anonymousConfessionSchema);
export default AnonymousConfession;
