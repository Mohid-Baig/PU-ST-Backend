import ReportIssue from "../models/reportIssueSchemma.js";
import User from '../models/userSchemma.js';

import cloudinary from '../config/cloudinary.js';

export const RegisterIssue = async (req, res, next) => {
    try {
        const { title, description, category, location } = req.body;

        if (!title || !description || !category || !location) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let parsedLocation;
        try {
            parsedLocation = JSON.parse(location);
            if (
                !parsedLocation ||
                parsedLocation.type !== 'Point' ||
                !Array.isArray(parsedLocation.coordinates) ||
                parsedLocation.coordinates.length !== 2
            ) {
                return res.status(400).json({ message: 'Invalid location format' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'Invalid JSON format for location' });
        }

        const file = req.files?.issueImage?.[0];
        if (!file) {
            return res.status(400).json({ message: 'Issue image is required' });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'issue_images' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(file.buffer);
        });

        const reportedBy = req.user.id;

        const issue = await ReportIssue.create({
            title,
            description,
            category,
            location: parsedLocation,
            photo: uploadResult.secure_url,
            reportedBy
        });

        const populatedIssue = await ReportIssue.findById(issue._id)
            .populate('reportedBy', 'fullName email');

        res.status(201).json({
            message: 'Report submitted successfully',
            issue: populatedIssue
        });

    } catch (err) {
        console.error('RegisterIssue Error:', err.message);
        res.status(500).json({ message: 'Server error during report creation' });
    }
};


export const GetAllIssues = async (req, res, next) => {
    try {
        const issues = await ReportIssue.find()
            .populate('reportedBy', 'fullName email profileImageUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            total: issues.length,
            issues
        });
    } catch (err) {
        console.error('GetAllIssues Error:', err.message);
        res.status(500).json({ message: 'Server error while fetching issues' });
    }
};
export const getIssuesByUniId = async (req, res, next) => {
    try {
        const { uniId } = req.params;

        const user = await User.findOne({ uniId });

        if (!user) {
            return res.status(404).json({ message: 'User with this University ID not found' });
        }

        const issues = await ReportIssue.find({ reportedBy: user._id })
            .populate('reportedBy', 'fullName email uniId')
            .sort({ createdAt: -1 });

        if (issues.length === 0) {
            return res.status(404).json({ message: 'No issues reported by this user' });
        }

        res.status(200).json({ issues });

    } catch (error) {
        console.error('getIssuesByUniId Error:', error.message);
        res.status(500).json({ message: 'Server error while fetching issues' });
    }
};

export const IssuesStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminRemarks } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update issue status' });
        }

        const validStatuses = ['pending', 'viewed', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        if (status === 'rejected' && (!adminRemarks || adminRemarks.trim() === '')) {
            return res.status(400).json({ message: 'Remarks are required when rejecting an issue' });
        }

        const issue = await ReportIssue.findById(id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        issue.status = status;
        if (adminRemarks) {
            issue.adminRemarks = adminRemarks;
        }

        await issue.save();

        res.status(200).json({
            message: 'Issue status updated successfully',
            issue
        });
    } catch (err) {
        console.error('IssuesStatus Error:', err.message);
        res.status(500).json({ message: 'Server error while updating issue status' });
    }
};


export const GetMyIssues = async (req, res, next) => {
    try {
        const myIssues = await ReportIssue.find({ reportedBy: req.user.id })
            .populate('reportedBy', 'fullName email profileImageUrl')
            .sort({ createdAt: -1 });
        if (!myIssues || myIssues.length === 0) {
            return res.status(404).json({ message: 'No issues reported by you' });
        }
        res.status(200).json({
            total: myIssues.length,
            issues: myIssues
        });
    }
    catch (err) {
        console.error('GetMyIssues Error:', err.message);
        res.status(500).json({ message: 'Server error while fetching your issues' });
    }
}