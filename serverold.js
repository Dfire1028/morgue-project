// const express = require('express');
// const mysql = require('mysql2/promise'); // promise-based
// const cors = require('cors');

// const app = express();
// const PORT = 5000;

// // Middleware
// app.use(cors());                 // allow your frontend to call this API
// app.use(express.json());        // parse JSON bodies

// // ✅ Serve static files from the "public" folder (your dashboard)
// app.use(express.static('public'));

// // MySQL connection pool (promise‑based)
// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',                // your MySQL username
//     password: '12345fred@',     // your MySQL password
//     database: 'morgue_db',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // ============================================
// // API: Get all body records
// // ============================================
// app.get('/api/bodies/all', async (req, res) => {
//     try {
//         const [rows] = await pool.query('SELECT * FROM bodies ORDER BY admission_date DESC');
//         res.json({
//             success: true,
//             data: rows
//         });
//     } catch (error) {
//         console.error('Error fetching bodies:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Database error: ' + error.message
//         });
//     }
// });

// // ============================================
// // NEW: POST route to add a new body record
// // ============================================
// app.post('/api/bodies/add', async (req, res) => {
//     try {
//         const {
//             caseNumber,
//             name,
//             admissionDate,
//             admissionTime,
//             height,
//             weight,
//             age,
//             skinTone,
//             gender,
//             causeOfDeath,
//             storageUnit,
//             distinguishingMarks,
//             additionalNotes
//         } = req.body;

//         // Basic validation
//         if (!caseNumber || !name || !admissionDate || !admissionTime ||
//             !height || !weight || !age || !skinTone || !gender ||
//             !storageUnit || !distinguishingMarks) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'All required fields must be filled.'
//             });
//         }

//         const sql = `INSERT INTO bodies 
//             (case_number, name, admission_date, admission_time, height, weight, 
//              age, skin_tone, gender, cause_of_death, storage_unit, 
//              distinguishing_marks, additional_notes)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//         const [result] = await pool.query(sql, [
//             caseNumber,
//             name,
//             admissionDate,
//             admissionTime,
//             parseFloat(height),
//             parseFloat(weight),
//             parseInt(age),
//             skinTone,
//             gender,
//             causeOfDeath || null,
//             storageUnit,
//             distinguishingMarks,
//             additionalNotes || null
//         ]);

//         res.json({
//             success: true,
//             message: 'Record saved successfully.',
//             body_id: result.insertId
//         });

//     } catch (error) {
//         console.error('Error inserting record:', error);
//         // Handle duplicate case number
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(409).json({
//                 success: false,
//                 message: 'A record with that case number already exists.'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Database error: ' + error.message
//         });
//     }
// });

// // ============================================
// // Root route
// // ============================================
// app.get('/', (req, res) => {
//     res.send('Morgue API is running...');
// });

// // ============================================
// // Start server
// // ============================================
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
























require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DB Pool ─────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
    host:             process.env.DB_HOST || 'localhost',
    user:             process.env.DB_USER || 'root',
    password:         process.env.DB_PASS || '12345fred@',
    database:         process.env.DB_NAME || 'morgue_db',
    waitForConnections: true,
    connectionLimit:  10,
    queueLimit:       0
});

// Test connection on startup
pool.getConnection()
    .then(conn => { console.log('✅ MySQL connected'); conn.release(); })
    .catch(err  => console.error('❌ MySQL connection failed:', err.message));

// ── GET all admissions ───────────────────────────────────────────────────────
app.get('/api/admissions', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM admissions ORDER BY admission_date DESC, admission_time DESC'
        );
        res.json({ success: true, admissions: rows });
    } catch (err) {
        console.error('GET /api/admissions error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST new admission ───────────────────────────────────────────────────────
app.post('/api/admissions', async (req, res) => {
    console.log('📥 POST /api/admissions received:', req.body);

    const {
        caseNumber, deceasedName, admissionDate, admissionTime,
        height, weight, age, skinTone, gender,
        causeOfDeath, storageUnit, distinguishingMarks, additionalNotes
    } = req.body;

    // Validate required fields
    const required = { caseNumber, admissionDate, admissionTime, height, weight, age, skinTone, gender, storageUnit, distinguishingMarks };
    const missing  = Object.entries(required).filter(([, v]) => v === undefined || v === null || v === '').map(([k]) => k);

    if (missing.length > 0) {
        console.warn('⚠️  Missing fields:', missing);
        return res.status(400).json({ success: false, message: 'Missing required fields: ' + missing.join(', ') });
    }

    const sql = `
        INSERT INTO admissions
            (case_number, deceased_name, admission_date, admission_time,
             height, weight, age, skin_tone, gender,
             cause_of_death, storage_unit, distinguishing_marks, additional_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await pool.query(sql, [
            caseNumber,
            deceasedName    || null,
            admissionDate,
            admissionTime,
            parseFloat(height),
            parseFloat(weight),
            parseInt(age),
            skinTone,
            gender,
            causeOfDeath    || null,
            storageUnit,
            distinguishingMarks,
            additionalNotes || null
        ]);

        console.log('✅ Inserted row id:', result.insertId);
        res.json({ success: true, message: 'Admission saved successfully.', id: result.insertId });

    } catch (err) {
        console.error('❌ INSERT error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A record with that case number already exists.' });
        }
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));