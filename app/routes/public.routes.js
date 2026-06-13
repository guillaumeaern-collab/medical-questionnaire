const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Route d'accueil
router.get('/', publicController.getHome);

module.exports = router;