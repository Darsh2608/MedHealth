const nodemailer = require('nodemailer');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail email address
    pass: process.env.EMAIL_PASS // Your Gmail password or app-specific password
  }
});

// Function to send an email
const sendEmail = async (toEmail, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email address
      to: toEmail, // Recipient email address
      subject: subject,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
