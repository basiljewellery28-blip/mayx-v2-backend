const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP transport
// For now, we use a placeholder configuration. 
// The user must update .env with actual credentials.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
    },
});

/**
 * Send a generic email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
const sendEmail = async (to, subject, html) => {
    try {
        // If no real credentials, just log it
        if (!process.env.SMTP_HOST) {
            console.log('📧 [Email Simulation] -----------------------------');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('Body:', html);
            console.log('---------------------------------------------------');
            return;
        }

        const info = await transporter.sendMail({
            from: '"MAYX System" <no-reply@mayx.com>', // sender address
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

/**
 * Send email notification for a new brief
 * @param {string} to - Recipient email
 * @param {object} brief - Brief object
 */
const sendBriefCreatedEmail = async (to, brief) => {
    const subject = `New Brief Created: ${brief.brief_number}`;
    const html = `
        <h1>New Brief Created</h1>
        <p>A new brief has been created in the system.</p>
        <ul>
            <li><strong>Brief Number:</strong> ${brief.brief_number}</li>
            <li><strong>Title:</strong> ${brief.title}</li>
            <li><strong>Client:</strong> ${brief.client_name || 'N/A'}</li>
        </ul>
        <p>Please log in to the dashboard to view details.</p>
    `;
    await sendEmail(to, subject, html);
};

/**
 * Send email notification for a new comment
 * @param {string} to - Recipient email
 * @param {object} brief - Brief object
 * @param {object} comment - Comment object
 */
const sendNewCommentEmail = async (to, brief, comment) => {
    const subject = `New Comment on Brief: ${brief.brief_number}`;
    const html = `
        <h2>New Comment</h2>
        <p>A new comment has been added to brief <strong>${brief.brief_number}</strong>.</p>
        <blockquote>
            ${comment.content}
        </blockquote>
        <p><em>By: ${comment.user_name || 'User'}</em></p>
        <p><a href="http://localhost:3000/briefs/${brief.id}">View Brief</a></p>
    `;
    await sendEmail(to, subject, html);
};

module.exports = {
    sendEmail,
    sendBriefCreatedEmail,
    sendNewCommentEmail,
};
