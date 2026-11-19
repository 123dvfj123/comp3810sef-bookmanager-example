const mongoose = require('mongoose');
const { Book } = require('../models/Book');

function validIdOr400(req, res) {
  if (mongoose.isValidObjectId(req.params.id)) {
    return true;
  }

  res.status(400).json({ error: 'Invalid book id.' });
  return false;
}

exports.list = async (req, res) => {
  const books = await Book.find().sort({ title: 1 });
  res.json(books);
};

exports.show = async (req, res) => {
  if (!validIdOr400(req, res)) {
    return;
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404).json({ error: 'Book not found.' });
    return;
  }

  res.json(book);
};

exports.create = async (req, res) => {
  const book = await Book.create(req.body || {});

  res
    .status(201)
    .location(`/api/books/${book.id}`)
    .json(book);
};

// PUT is treated as a full replacement of the editable fields. Required
// fields must therefore be supplied again in the request body.
exports.update = async (req, res) => {
  if (!validIdOr400(req, res)) {
    return;
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404).json({ error: 'Book not found.' });
    return;
  }

  const body = req.body || {};
  book.title = body.title;
  book.author = body.author;
  book.year = body.year;
  book.category = body.category;

  if (Object.prototype.hasOwnProperty.call(body, 'available')) {
    book.available = body.available;
  }

  await book.save();
  res.json(book);
};

exports.remove = async (req, res) => {
  if (!validIdOr400(req, res)) {
    return;
  }

  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    res.status(404).json({ error: 'Book not found.' });
    return;
  }

  res.status(204).end();
};