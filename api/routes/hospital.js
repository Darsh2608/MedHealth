// routes/hospitalRoutes.js
const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hopital.controller');

router.get('/searchByLocation', hospitalController.searchByLocation);
router.get('/searchByName', hospitalController.searchByName);
router.get('/searchByDoctorName', hospitalController.searchByDoctorName);

module.exports = router;
