import User from '../models/userSchemma.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendEmail.js';
import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

export const RegisterUser = async (req, res, next) => {
    const profileImage = req.files?.profileImage?.[0];
    const uniCardImage = req.files?.uniCardImage?.[0];

    try {
        const { fullName, uniId, email, password, role } = req.body;

        if (!fullName || !uniId || !email || !password) {
            throw new Error('All fields are required');
        }

        if (!validator.isEmail(email)) {
            throw new Error('Invalid email format');
        }

        const existingUser = await User.findOne({ $or: [{ email }, { uniId }] });
        if (existingUser) {
            throw new Error('Email or University ID already registered');
        }

        if (!uniCardImage) {
            throw new Error('University card image is required.');
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        let profileImageUrl = '';
        let uniCardImageUrl = '';

        if (profileImage) {
            const profileResult = await cloudinary.uploader.upload_stream(
                { folder: 'profile_images' },
                (error, result) => {
                    if (error) throw new Error(error.message);
                    profileImageUrl = result.secure_url;
                }
            );
            profileResult.end(profileImage.buffer);
        }

        if (uniCardImage) {
            const uniCardResult = await cloudinary.uploader.upload_stream(
                { folder: 'uni_card_images' },
                (error, result) => {
                    if (error) throw new Error(error.message);
                    uniCardImageUrl = result.secure_url;
                }
            );
            uniCardResult.end(uniCardImage.buffer);
        }

        const user = await User.create({
            fullName,
            uniId,
            email,
            password,
            role,
            profileImageUrl,
            uniCardImageUrl,
            verificationToken,
        });

        await sendVerificationEmail(email, verificationToken);
        console.log('📧 Sent verification email to:', email);

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                uniId: user.uniId,
                role: user.role,
                isVerified: user.isVerified,
                profileImageUrl: user.profileImageUrl,
                uniCardImageUrl: user.uniCardImageUrl,
            },
        });

    } catch (error) {
        console.error('RegisterUser Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};


export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );
        user.refreshToken = refreshToken;
        await user.save();



        res.status(200).json({
            message: 'Login successful',
            authtoken: token,
            refreshtoken: refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                uniId: user.uniId,
                role: user.role,
                isVerified: user.isVerified,
                profileImageUrl: user.profileImageUrl,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const getMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('GetMyProfile Error:', error.message);
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        let { fullName, uniId, email } = req.body;

        fullName = fullName?.trim();
        uniId = uniId?.trim();
        email = email?.trim();

        if (!fullName || !uniId || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const emailChanged = user.email !== email;
        const uniIdChanged = user.uniId !== uniId;

        if (emailChanged) {
            const emailExists = await User.findOne({ email });
            if (emailExists && emailExists._id.toString() !== req.user.id) {
                return res.status(409).json({ message: 'Email already in use by another user' });
            }
        }

        if (uniIdChanged) {
            const uniIdExists = await User.findOne({ uniId });
            if (uniIdExists && uniIdExists._id.toString() !== req.user.id) {
                return res.status(409).json({ message: 'University ID already in use by another user' });
            }
        }

        user.fullName = fullName;
        user.uniId = uniId;
        user.email = email;

        if (req.files?.profileImage?.[0]) {
            const profileImage = req.files.profileImage[0];
            const profileResult = await cloudinary.uploader.upload_stream(
                { folder: 'profile_images' },
                (error, result) => {
                    if (error) throw new Error(error.message);
                    user.profileImageUrl = result.secure_url;
                }
            );
            profileResult.end(profileImage.buffer);
        }

        if (req.files?.uniCardImage?.[0]) {
            const uniCardImage = req.files.uniCardImage[0];
            const uniCardResult = await cloudinary.uploader.upload_stream(
                { folder: 'uni_card_images' },
                (error, result) => {
                    if (error) throw new Error(error.message);
                    user.uniCardImageUrl = result.secure_url;
                }
            );
            uniCardResult.end(uniCardImage.buffer);
        }

        if (emailChanged) {
            user.isVerified = false;
            user.verificationToken = crypto.randomBytes(32).toString('hex');
            await sendVerificationEmail(user.email, user.verificationToken);
        }

        await user.save();

        res.status(200).json({
            message: emailChanged ? 'Profile updated. Please verify your new email.' : 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                uniId: user.uniId,
                role: user.role,
                isVerified: user.isVerified,
                profileImageUrl: user.profileImageUrl,
                uniCardImageUrl: user.uniCardImageUrl,
            },
        });
    } catch (error) {
        console.error('UpdateProfile Error:', error.message);
        next(error);
    }
};


export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('VerifyEmail Error:', error.message);
        res.status(500).json({ message: 'Server error during verification' });
    }
};
export const logoutUser = async (req, res) => {
    try {
        const userId = req.user.id;
        await User.findByIdAndUpdate(userId, { refreshToken: null });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Server error during logout" });
    }
};