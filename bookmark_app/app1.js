const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./bookmark.db');

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website_name TEXT,
      aim TEXT,
      description TEXT,
      link TEXT
    )
  `);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine to serve HTML files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Routes
// Display all bookmarks
app.get('/', (req, res) => {
  db.all("SELECT * FROM bookmarks", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      res.render('index', { bookmarks: rows });
    }
  });
});

// Add a new bookmark
app.post('/add', (req, res) => {
  const { website_name, aim, description, link } = req.body;
  db.run("INSERT INTO bookmarks (website_name, aim, description, link) VALUES (?, ?, ?, ?)", 
  [website_name, aim, description, link], 
  (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      res.redirect('/');
    }
  });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
