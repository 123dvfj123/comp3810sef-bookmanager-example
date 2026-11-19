const mongoose = require('mongoose');
const { Book, CATEGORIES } = require('../models/Book');

function formInput(body = {}) {
  return {
    title: body.title,
    author: body.author,
    year: body.year,
    category: body.category,
    // An unchecked HTML checkbox is not sent at all, so absence means false.
    available: body.available === 'on',
  };
}

function validationMessages(error) {
  return Object.values(error.errors).map((item) => item.message);
}

async function findBook(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Book.findById(id);
}

function renderBookNotFound(res) {
  return res.status(404).render('not-found', {
    title: 'Book not found',
    message: 'That book does not exist or has already been deleted.',
  });
}

exports.list = async (req, res) => {
  const books = await Book.find().sort({ title: 1 });
  res.render('books/index', { title: 'Books', books });
};

exports.showNewForm = (req, res) => {
  res.render('books/new', {
    title: 'Add book',
    book: { available: true },
    categories: CATEGORIES,
    errors: [],
  });
};

exports.create = async (req, res) => {
  try {
    await Book.create(formInput(req.body));
    return res.redirect('/books');
  } catch (error) {
    if (error.name !== 'ValidationError') {
      throw error;
    }

    return res.status(400).render('books/new', {
      title: 'Add book',
      book: formInput(req.body),
      categories: CATEGORIES,
      errors: validationMessages(error),
    });
  }
};

exports.show = async (req, res) => {
  const book = await findBook(req.params.id);

  if (!book) {
    return renderBookNotFound(res);
  }

  return res.render('books/show', { title: book.title, book });
};

exports.showEditForm = async (req, res) => {
  const book = await findBook(req.params.id);

  if (!book) {
    return renderBookNotFound(res);
  }

  return res.render('books/edit', {
    title: `Edit ${book.title}`,
    book,
    categories: CATEGORIES,
    errors: [],
  });
};

exports.update = async (req, res) => {
  const book = await findBook(req.params.id);

  if (!book) {
    return renderBookNotFound(res);
  }

  book.set(formInput(req.body));

  try {
    await book.save();
    return res.redirect(`/books/${book.id}`);
  } catch (error) {
    if (error.name !== 'ValidationError') {
      throw error;
    }

    return res.status(400).render('books/edit', {
      title: `Edit ${book.title || 'book'}`,
      book,
      categories: CATEGORIES,
      errors: validationMessages(error),
    });
  }
};

exports.remove = async (req, res) => {
  const book = await findBook(req.params.id);

  if (!book) {
    return renderBookNotFound(res);
  }

  await book.deleteOne();
  return res.redirect('/books');
};