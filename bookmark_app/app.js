const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database('./bookmark.db');

// Create bookmarks table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      description TEXT,
      link TEXT,
      image_filename TEXT
    )
  `);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // For serving uploaded images

// Set view engine to serve HTML files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with a timestamp to avoid name conflicts
  }
});

const upload = multer({ storage });

// Display all bookmarks and distinct categories
app.get('/', (req, res) => {
  const categoryFilter = req.query.category || '';  // Get the category filter from query params, if any
  
  // Query to fetch bookmarks with optional category filter
  let query = "SELECT * FROM bookmarks";
  let params = [];

  if (categoryFilter) {
    query += " WHERE category = ?";
    params.push(categoryFilter);
  }

  db.all(query, params, (err, bookmarks) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      // Fetch distinct categories for the dropdown
      db.all("SELECT DISTINCT category FROM bookmarks", (err, categories) => {
        if (err) {
          console.error(err);
          res.status(500).send("Database error");
        } else {
          res.render('index', { bookmarks, categories, selectedCategory: categoryFilter });
        }
      });
    }
  });
});

// Add a new bookmark with image upload
app.post('/add', upload.single('image'), (req, res) => {
  const { title, category, description, link } = req.body;
  const image_filename = req.file ? req.file.filename : null;  // Store the image filename if uploaded

  db.run("INSERT INTO bookmarks (title, category, description, link, image_filename) VALUES (?, ?, ?, ?, ?)", 
  [title, category, description, link, image_filename], 
  (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      res.redirect('/');
    }
  });
});

// Delete the entire bookmarks table
app.delete('/deleteTable', (req, res) => {
  db.run("DROP TABLE IF EXISTS bookmarks", (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error deleting the table");
    } else {
      res.status(200).send("Bookmarks table deleted successfully");
    }
  });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
