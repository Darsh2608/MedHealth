const bcrypt = require('bcryptjs');
const models = require("../models");
const User = models.Users;
const { Users } = require("../models");


module.exports = {
    async list(req, res) {
        try {
            const users = await User.findAll();
            return res.json(users);
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async create(req, res) {
        const { username, email, password, type } = req.body;
      
        // Perform validation here
      
        try {
          const user = await Users.create(
            { name: username, email, password, type, created_at: new Date(), updated_at: new Date() },
            { attributes: ['id', 'name', 'email', 'password', 'type', 'created_at', 'updated_at'] } // Include password in attributes
          );
          return res.status(201).json(user);
        } catch (error) {
          return res.status(400).json({ error: 'Invalid Request' });
        }
      },
      
    async update(req, res) {
        const { id } = req.params;
        const { name, email, password, type } = req.body;
        // Perform validation here

        try {
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.name = name;
            user.email = email;
            user.type = type;

            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            await user.save();

            return res.json(user);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid Request' });
        }
    },

    async delete(req, res) {
        const { id } = req.params;

        try {
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            await user.destroy();

            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
