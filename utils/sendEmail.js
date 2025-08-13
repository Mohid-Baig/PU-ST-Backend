import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        const mailOptions = {
            from: `"PU Smart Tracker App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - PU Smart Tracker App',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to PU Smart Tracker App!</h2>
            <p style="font-size: 16px; color: #555;">
                Thank you for signing up. Please verify your email address to activate your account and start using the app.
            </p>
            <p style="font-size: 16px; color: #555;">
                Click the button below to verify your account:
            </p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" target="_blank" 
                    style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
            </p>
            <p style="font-size: 14px; color: #888;">
                If the button above doesn't work, copy and paste the following link into your browser:
                <br />
                <a href="${verifyUrl}" target="_blank" style="color: #007bff;">${verifyUrl}</a>
            </p>
            <p style="font-size: 14px; color: #aaa; margin-top: 40px;">
                If you did not sign up for PU Smart Tracker App, please ignore this email.
            </p>
        </div>
    `
        };


        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        throw error;
    }
};
