const nodemailer = require('nodemailer');
const { BookingAppointments } = require('../models');

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // such as 'Gmail', 'Outlook', etc.
  port: 587,
  auth: {
    user: 'erwin.hansen@ethereal.email',
    pass: 'H8eCBrMCj1EDkWGhxZ',
  },
  debug: true, // Enable debugging mode
});

const list = async (req, res) => {
  try {
    const users = await BookingAppointments.findAll();
    console.log('=============', users);
    return res.json(users);
  } catch (error) {
    console.error('Error fetching booking appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch booking appointments.' });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      patientName,
      phoneNumber,
      email,
      gender,
      hospital,
      consulting,
      services,
      appointmentDate,
      appointmentTime,
    } = req.body;

    // Validate input data
    if (!patientName || !phoneNumber || !email || !gender || !hospital || !consulting || !services || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Create a new booking appointment record with createdAt and updatedAt fields
    const newBooking = await BookingAppointments.create({
      patient_name: patientName,
      phone_number: phoneNumber,
      email,
      gender,
      hospital_name: hospital,
      consulting,
      services,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Send confirmation email
    const mailOptions = {
      from: '"MedCoonect" <rudra27.official@gmail.com>',
      to: "rudrabhagat02@gmail.com",
      subject: 'Appointment Confirmation',
      text: `Hello ${patientName}, your appointment has been booked successfully at ${hospital} on ${appointmentDate} ${appointmentTime}.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking appointment.' });
  }
};

module.exports = { createBooking, list };
