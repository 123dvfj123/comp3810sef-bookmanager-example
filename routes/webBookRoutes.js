const express = require('express');
const bookController = require('../controllers/bookController');
const asyncHandler = require('../middleware/async-handler');
const requireAuth = require('../middleware/require-auth');

const router = express.Router();

// Every route below this line requires a valid signed session cookie.
router.use(requireAuth);

router.get('/books', asyncHandler(bookController.list));
router.get('/books/new', bookController.showNewForm);
router.post('/books', asyncHandler(bookController.create));
router.get('/books/:id', asyncHandler(bookController.show));
router.get('/books/:id/edit', asyncHandler(bookController.showEditForm));
router.post('/books/:id/update', asyncHandler(bookController.update));
router.post('/books/:id/delete', asyncHandler(bookController.remove));

module.exports = router;