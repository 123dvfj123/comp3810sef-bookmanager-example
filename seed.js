require('dotenv').config();

const mongoose = require('mongoose');
const { Book } = require('./models/Book');

const sampleBooks = [
  {
    title: 'The Three-Body Problem',
    author: 'Liu Cixin',
    year: 2008,
    category: 'Science',
    available: true,
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    year: 2008,
    category: 'Technology',
    available: true,
  },
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    year: 1937,
    category: 'Fiction',
    available: false,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    year: 2011,
    category: 'History',
    available: true,
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt and David Thomas',
    year: 1999,
    category: 'Technology',
    available: true,
  },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is missing. Copy .env.example to .env and fill it in.'
    );
  }

  await mongoose.connect(mongoUri);

  for (const book of sampleBooks) {
    // Upsert makes the script safe to run more than once: an existing book
    // with the same title and author is updated instead of duplicated.
    await Book.updateOne(
      { title: book.title, author: book.author },
      { $set: book },
      { upsert: true, runValidators: true }
    );
  }

  console.log(`Seeded ${sampleBooks.length} sample books.`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });