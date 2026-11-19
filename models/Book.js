const mongoose = require('mongoose');

const CATEGORIES = ['Fiction', 'Science', 'History', 'Technology'];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required.'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required.'],
      min: [1000, 'Year must be at least 1000.'],
      max: [2100, 'Year must be at most 2100.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: {
        values: CATEGORIES,
        message: 'Category must be one of: Fiction, Science, History, Technology.',
      },
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'books',
    timestamps: true,
    versionKey: false,
  }
);

module.exports = {
  Book: mongoose.model('Book', bookSchema),
  CATEGORIES,
};