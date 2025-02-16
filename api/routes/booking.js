const express = require('express');
const router = express.Router();
const { createBooking, list } = require('../controllers/booking.controller');

// POST route for creating a new booking appointment
router.post('/create', createBooking);
router.get('/list', list);

module.exports = router;
