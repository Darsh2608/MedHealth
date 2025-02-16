// controllers/hospitalController.js
const models = require("../models");
const Hospital = models.HOSPITALS;


exports.searchByLocation = async (req, res) => {
    try {
        const location = req.query.data;
        console.log('=================location', location);

        const hospital = await Hospital.searchLocation(location);
        console.log('8888888888888888888888', hospital);
        if (hospital) {
            res.status(200).json([hospital]); // Wrap the hospital in an array for consistency with findAll
        } else {
            res.status(404).json({ message: "No hospitals found for the given location" });
        }
    } catch (error) {
        console.error("Error searching hospitals by location:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.searchByName = async (req, res) => {
    try {
        const name = req.query.name;
        console.log('=================name', name);

        const hospitals = await Hospital.findAll({ where: { hospital_name: name } });
        res.status(200).json(hospitals);
    } catch (error) {
        console.error("Error searching hospitals by name:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.searchByDoctorName = async (req, res) => {
    try {
        const doctorName = req.query.doctorName;
        const hospitals = await Hospital.findAll({ where: { doctor_name: doctorName } });
        res.status(200).json(hospitals);
    } catch (error) {
        console.error("Error searching hospitals by doctor name:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
