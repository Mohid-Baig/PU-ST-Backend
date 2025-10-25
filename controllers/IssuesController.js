import ReportIssue from "../models/reportIssueSchemma.js";
import User from '../models/userSchemma.js';
import cloudinary from '../config/cloudinary.js';

export const RegisterIssue = async (req, res, next) => {
    try {
        console.log('=== RegisterIssue Request ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const { title, description, category, location } = req.body;

        if (!title || !description || !category || !location) {
            console.log('Missing fields:', { title: !!title, description: !!description, category: !!category, location: !!location });
            return res.status(400).json({ message: 'All fields are required' });
        }

        let parsedLocation;
        try {
            parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

            console.log('Parsed location:', parsedLocation);

            if (
                !parsedLocation ||
                parsedLocation.type !== 'Point' ||
                !Array.isArray(parsedLocation.coordinates) ||
                parsedLocation.coordinates.length !== 2 ||
                typeof parsedLocation.coordinates[0] !== 'number' ||
                typeof parsedLocation.coordinates[1] !== 'number'
            ) {
                console.log('Invalid location format:', parsedLocation);
                return res.status(400).json({
                    message: 'Invalid location format. Expected: {type: "Point", coordinates: [longitude, latitude]}'
                });
            }
        } catch (err) {
            console.error('Location parsing error:', err);
            return res.status(400).json({
                message: 'Invalid JSON format for location',
                error: err.message
            });
        }

        let photo = null;
        const file = req.files?.issueImage?.[0];

        if (file) {
            console.log('Uploading image to Cloudinary...');
            console.log('File details:', {
                mimetype: file.mimetype,
                size: file.size,
                originalname: file.originalname
            });

            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'issue_images',
                            resource_type: 'auto',
                            transformation: [
                                { width: 1000, height: 1000, crop: 'limit' },
                                { quality: 'auto' }
                            ]
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                console.log('Cloudinary upload success:', result.secure_url);
                                resolve(result);
                            }
                        }
                    );
                    stream.end(file.buffer);
                });

                photo = {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                };
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(500).json({
                    message: 'Failed to upload image. Please try again.',
                    error: uploadError.message
                });
            }
        }

        if (!req.user || !req.user.id) {
            console.error('User not authenticated');
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const reportedBy = req.user.id;
        console.log('Creating issue for user:', reportedBy);

        const issueData = {
            title: title.trim(),
            description: description.trim(),
            category,
            location: parsedLocation,
            photo,
            reportedBy
        };

        console.log('Issue data to create:', issueData);

        const issue = await ReportIssue.create(issueData);
        console.log('Issue created with ID:', issue._id);

        const populatedIssue = await ReportIssue.findById(issue._id)
            .populate('reportedBy', 'fullName email profileImageUrl');

        console.log('Issue creation successful');

        res.status(201).json({
            message: 'Report submitted successfully',
            issue: populatedIssue
        });

    } catch (err) {
        console.error('=== RegisterIssue Error ===');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Stack trace:', err.stack);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: Object.values(err.errors).map(e => e.message)
            });
        }

        if (err.name === 'MongoError' || err.name === 'MongoServerError') {
            return res.status(500).json({
                message: 'Database error. Please try again later.'
            });
        }

        res.status(500).json({
            message: 'Server error during report creation',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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

        res.status(200).json({
            total: issues.length,
            issues
        });

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
        console.log('GetMyIssues called for user:', req.user.id);

        const myIssues = await ReportIssue.find({ reportedBy: req.user.id })
            .populate('reportedBy', 'fullName email profileImageUrl')
            .sort({ createdAt: -1 });

        console.log('Found issues:', myIssues.length);

        res.status(200).json({
            total: myIssues.length,
            issues: myIssues
        });

    } catch (err) {
        console.error('GetMyIssues Error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: 'Server error while fetching your issues' });
    }
}