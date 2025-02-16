const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.get('/', UserController.list);
router.post('/users', UserController.create);
router.put('/users/:id', UserController.update);
router.delete('/users/:id', UserController.delete);

module.exports = router;
