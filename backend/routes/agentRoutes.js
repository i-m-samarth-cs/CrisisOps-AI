const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/run-agent', agentController.runAgent);
router.get('/status/:id', agentController.getAgentStatus);
router.get('/results/:id', agentController.getAgentResults);

module.exports = router;
