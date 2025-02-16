const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Users } = require("../models");

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await Users.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('*******************', req.body);
        // Find user by email
        const user = await Users.findOne({ where: { email } });
        console.log('*******************user', user.id);

        // If user not found
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if password is correct (without bcrypt)
        if (password !== user.password) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JSON_SECRET_TOKEN, { expiresIn: "1h" });

        // Additional data to pass with the token
        const userData = {
            id: user.id,
            email: user.email,
            type: user.type
            // Add more user data as needed
        };

        res.status(200).json({ token, user: userData }); // Pass user data along with the token
    } catch (error) {
        console.error("Error signing in:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getUserData = async (req, res) => {
    try {
        const userId = req.userId; // Assuming you set userId in request object after JWT verification

        // Fetch user data
        const user = await Users.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
