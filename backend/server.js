const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve test HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Database setup
const dbPath = path.join(__dirname, 'contacts.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        createTable();
    }
});

// Create contacts table if it doesn't exist
function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    `;
    
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Contacts table ready');
        }
    });
}

// API Routes
// GET /contacts - Get all contacts with pagination
app.get('/contacts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First get total count
    db.get('SELECT COUNT(*) as total FROM contacts', [], (countErr, countResult) => {
        if (countErr) {
            console.error('Error counting contacts:', countErr);
            return res.status(500).json({ error: 'Failed to fetch contacts' });
        }

        const totalContacts = countResult.total;
        const totalPages = Math.ceil(totalContacts / limit);

        // Then get paginated results
        const sql = 'SELECT * FROM contacts LIMIT ? OFFSET ?';
        db.all(sql, [limit, offset], (err, rows) => {
            if (err) {
                console.error('Error fetching contacts:', err);
                res.status(500).json({ error: 'Failed to fetch contacts' });
            } else {
                res.json({
                    contacts: rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalContacts: totalContacts,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                });
            }
        });
    });
});

// POST /contacts - Add a new contact
app.post('/contacts', (req, res) => {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const id = uuidv4();
    const sql = 'INSERT INTO contacts (id, name, email, phone) VALUES (?, ?, ?, ?)';
    
    db.run(sql, [id, name, email, phone], (err) => {
        if (err) {
            console.error('Error adding contact:', err);
            res.status(500).json({ error: 'Failed to add contact' });
        } else {
            res.status(201).json({ id, name, email, phone });
        }
    });
});

// DELETE /contacts/:id - Delete a contact
app.delete('/contacts/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM contacts WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error deleting contact:', err);
            res.status(500).json({ error: 'Failed to delete contact' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Contact not found' });
        } else {
            res.json({ success: true });
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
}).on('error', (err) => {
    console.error('Server error:', err);
});