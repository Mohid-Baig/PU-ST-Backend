// models/lostFoundSchemma.js
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
            type: String // store file path or URL
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

    // when status last changed — used to auto-archive after N days
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },

    isAnonymous: {
        type: Boolean,
        default: false
    },

    // link to the matching lost/found item (if any)
    relatedItem: {
        type: Schema.Types.ObjectId,
        ref: 'LostFoundItem',
        default: null
    },

    // optional expiration date (we'll use cron to archive instead of TTL delete)
    expiresAt: {
        type: Date,
        default: function () {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation
        }
    }
}, {
    timestamps: true
});

// keep statusUpdatedAt current whenever status changes
lostFoundItemSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.statusUpdatedAt = new Date();
    }
    next();
});

// Useful indexes for queries
lostFoundItemSchema.index({ reportedBy: 1 });
lostFoundItemSchema.index({ status: 1 });
lostFoundItemSchema.index({ expiresAt: 1 });

const LostFound = mongoose.model('LostFoundItem', lostFoundItemSchema);
export default LostFound;
