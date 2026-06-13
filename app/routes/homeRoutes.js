const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.getHome);
router.get('/enregistrement', homeController.getEnregistrement);
router.post('/enregistrement', homeController.postEnregistrement);
router.post('/question-response', homeController.postQuestionResponse);
router.post('/submit-questionnaire', homeController.submitQuestionnaire);

module.exports = router;