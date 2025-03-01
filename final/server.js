const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('students.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS certificateRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificateType TEXT,
    purpose TEXT,
    copies INTEGER,
    comments TEXT,
    uploadedFiles TEXT,
    timestamp TEXT
)`);

// Endpoint to store certificate request
app.post('/submitRequest', (req, res) => {
    const { certificateType, purpose, copies, comments, uploadedFiles } = req.body;
    const timestamp = new Date().toISOString();

    db.run(
        `INSERT INTO certificateRequests (certificateType, purpose, copies, comments, uploadedFiles, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [certificateType, purpose, copies, comments, JSON.stringify(uploadedFiles), timestamp],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Endpoint to get all stored requests
app.get('/getRequests', (req, res) => {
    db.all(`SELECT * FROM certificateRequests`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
