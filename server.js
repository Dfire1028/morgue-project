require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DB Pool ──────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
    host:               process.env.DB_HOST || 'localhost',
    user:               process.env.DB_USER || 'root',
    password:           process.env.DB_PASS || '12345fred@',
    database:           process.env.DB_NAME || 'morgue_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

pool.getConnection()
    .then(c => { console.log('✅ MySQL connected'); c.release(); })
    .catch(e => console.error('❌ MySQL failed:', e.message));

// ════════════════════════════════════════════════════════════════════════════
// ADMISSIONS
// ════════════════════════════════════════════════════════════════════════════

// GET all admissions
app.get('/api/admissions', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM admissions ORDER BY admission_date DESC, admission_time DESC`
        );
        res.json({ success: true, admissions: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST new admission
app.post('/api/admissions', async (req, res) => {
    console.log('📥 New admission:', req.body);
    const {
        caseNumber, deceasedName, admissionDate, admissionTime,
        height, weight, age, skinTone, gender,
        causeOfDeath, storageUnit, distinguishingMarks, additionalNotes
    } = req.body;

    const required = { caseNumber, admissionDate, admissionTime, height, weight, age, skinTone, gender, storageUnit, distinguishingMarks };
    const missing  = Object.entries(required).filter(([, v]) => !v && v !== 0).map(([k]) => k);
    if (missing.length) return res.status(400).json({ success: false, message: 'Missing: ' + missing.join(', ') });

    try {
        const [result] = await pool.query(
            `INSERT INTO admissions
             (case_number, deceased_name, admission_date, admission_time,
              height, weight, age, skin_tone, gender,
              cause_of_death, storage_unit, distinguishing_marks, additional_notes, status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'active')`,
            [caseNumber, deceasedName||null, admissionDate, admissionTime,
             parseFloat(height), parseFloat(weight), parseInt(age),
             skinTone, gender, causeOfDeath||null, storageUnit,
             distinguishingMarks, additionalNotes||null]
        );
        res.json({ success: true, message: 'Admission saved.', id: result.insertId });
    } catch (e) {
        console.error(e);
        if (e.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ success: false, message: 'Case number already exists.' });
        res.status(500).json({ success: false, message: e.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
// STORAGE UNITS  — real capacity from DB
// ════════════════════════════════════════════════════════════════════════════

// GET storage units with live occupancy
app.get('/api/storage', async (req, res) => {
    try {
        // Count active admissions per unit
        const [occupancy] = await pool.query(
            `SELECT storage_unit, COUNT(*) AS occupied
             FROM admissions WHERE status = 'active'
             GROUP BY storage_unit`
        );
        const occupancyMap = {};
        occupancy.forEach(r => { occupancyMap[r.storage_unit] = r.occupied; });

        const [units] = await pool.query(
            `SELECT * FROM storage_units ORDER BY unit_code`
        );

        const result = units.map(u => ({
            ...u,
            occupied:  occupancyMap[u.unit_code] || 0,
            available: u.capacity - (occupancyMap[u.unit_code] || 0)
        }));

        // Summary by type
        const summary = {};
        result.forEach(u => {
            if (!summary[u.unit_type]) summary[u.unit_type] = { total: 0, occupied: 0, available: 0 };
            summary[u.unit_type].total     += u.capacity;
            summary[u.unit_type].occupied  += u.occupied;
            summary[u.unit_type].available += u.available;
        });

        res.json({ success: true, units: result, summary });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
// RELEASES
// ════════════════════════════════════════════════════════════════════════════

// GET all releases
app.get('/api/releases', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, a.storage_unit FROM releases r
             LEFT JOIN admissions a ON a.id = r.admission_id
             ORDER BY r.release_date DESC, r.release_time DESC`
        );
        res.json({ success: true, releases: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST new release
app.post('/api/releases', async (req, res) => {
    console.log('📥 New release:', req.body);
    const { admissionId, releaseDate, releaseTime, releasedTo, relationship, idNumber, authorizedBy, notes } = req.body;

    const required = { admissionId, releaseDate, releaseTime, releasedTo, relationship, idNumber, authorizedBy };
    const missing  = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) return res.status(400).json({ success: false, message: 'Missing: ' + missing.join(', ') });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Get the admission record
        const [[admission]] = await conn.query(
            `SELECT * FROM admissions WHERE id = ? AND status = 'active'`, [admissionId]
        );
        if (!admission) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Active admission not found.' });
        }

        // Insert release record
        await conn.query(
            `INSERT INTO releases
             (admission_id, case_number, deceased_name, release_date, release_time,
              released_to, relationship, id_number, authorized_by, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [admissionId, admission.case_number, admission.deceased_name,
             releaseDate, releaseTime, releasedTo, relationship, idNumber, authorizedBy, notes||null]
        );

        // Mark admission as released
        await conn.query(
            `UPDATE admissions SET status = 'released' WHERE id = ?`, [admissionId]
        );

        await conn.commit();
        res.json({ success: true, message: 'Body released successfully.' });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    } finally {
        conn.release();
    }
});

// ════════════════════════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/reports', async (req, res) => {
    try {
        const { from, to } = req.query;
        const dateFilter = from && to ? `AND admission_date BETWEEN '${from}' AND '${to}'` : '';

        // Total admissions
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM admissions WHERE 1=1 ${dateFilter}`
        );
        // Active
        const [[{ active }]] = await pool.query(
            `SELECT COUNT(*) AS active FROM admissions WHERE status='active' ${dateFilter}`
        );
        // Released
        const [[{ released }]] = await pool.query(
            `SELECT COUNT(*) AS released FROM admissions WHERE status='released' ${dateFilter}`
        );
        // By gender
        const [byGender] = await pool.query(
            `SELECT gender, COUNT(*) AS count FROM admissions WHERE 1=1 ${dateFilter} GROUP BY gender`
        );
        // By storage unit type
        const [byStorage] = await pool.query(
            `SELECT storage_unit, COUNT(*) AS count FROM admissions WHERE status='active' GROUP BY storage_unit`
        );
        // Monthly trend (last 6 months)
        const [monthly] = await pool.query(
            `SELECT DATE_FORMAT(admission_date,'%Y-%m') AS month, COUNT(*) AS count
             FROM admissions
             WHERE admission_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month`
        );
        // Recent releases
        const [recentReleases] = await pool.query(
            `SELECT * FROM releases ORDER BY release_date DESC LIMIT 5`
        );

        res.json({
            success: true,
            stats: { total, active, released },
            byGender, byStorage, monthly, recentReleases
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
