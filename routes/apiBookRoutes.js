const express = require('express');
const apiBookController = require('../controllers/apiBookController');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();

// REST API routes. They use HTTP verbs and plural resource nouns.
// No session check is added because the course requirement says the API
// should remain accessible without web-page authentication.
router.get('/books', asyncHandler(apiBookController.list));
router.get('/books/:id', asyncHandler(apiBookController.show));
router.post('/books', asyncHandler(apiBookController.create));
router.put('/books/:id', asyncHandler(apiBookController.update));
router.delete('/books/:id', asyncHandler(apiBookController.remove));

module.exports = router;