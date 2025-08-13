import mongoose from 'mongoose';

const helpBoardPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    replies: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            message: {
                type: String,
                required: true,
                trim: true,
                minlength: 1
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    status: {
        type: String,
        enum: ['active', 'flagged', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

const HelpBoardPost = mongoose.model('HelpBoardPost', helpBoardPostSchema);
export default HelpBoardPost;
