import mongoose from 'mongoose';
const { Schema } = mongoose;

const lostFoundItemSchema = new Schema({
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
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    category: {
        type: String,
        enum: ['electronics', 'clothing', 'documents', 'accessories', 'other'],
        default: 'other'
    },
    dateLostOrFound: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    photos: [
        {
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        }
    ],
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contactInfo: {
        type: String,
        trim: true,
        default: ''
    },
    collectionInfo: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'claimed', 'returned', 'archived', 'expired'],
        default: 'active'
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    relatedItem: {
        type: Schema.Types.ObjectId,
        ref: 'LostFoundItem',
        default: null
    },
    expiresAt: {
        type: Date,
        default: function () {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    }
}, {
    timestamps: true
});

lostFoundItemSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.statusUpdatedAt = new Date();
    }
    next();
});

lostFoundItemSchema.index({ reportedBy: 1 });
lostFoundItemSchema.index({ status: 1 });
lostFoundItemSchema.index({ expiresAt: 1 });

const LostFound = mongoose.model('LostFoundItem', lostFoundItemSchema);
export default LostFound;
