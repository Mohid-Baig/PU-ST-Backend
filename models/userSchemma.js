import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    uniId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    profileImageUrl: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    uniCardImageUrl: {
        type: String,
        default: '',
        required: true
    },
    verificationToken: {
        type: String,
        default: null
    },
    refreshToken: {
        type: String
    },
    fcmToken: {
        type: String
    },
    fcmTokens: [
        {
            type: String
        }],
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// userSchema.index({ email: 1 });
// userSchema.index({ uniId: 1 });

const User = mongoose.model('User', userSchema);
export default User;
