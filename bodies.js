const express = require('express');
const router = express.Router();
const pool = require('../config');

// Generate unique Body ID
function generateBodyID() {
    return "BODY-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

// POST - Save new body record
router.post('/save', async (req, res) => {
    const { height, weight, age, skin_tone, gender, distinguishing_marks, storage_unit } = req.body;

    // Validate all fields
    if (!height || !weight || !age || !skin_tone || !gender || !storage_unit) {
        return res.json({ success: false, message: 'All fields are required' });
    }

    try {
        const body_id = generateBodyID();
        const query = `
            INSERT INTO bodies (body_id, height, weight, age, skin_tone, gender, distinguishing_marks, storage_unit, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const connection = await pool.getConnection();
        await connection.execute(query, [
            body_id, 
            height, 
            weight, 
            age, 
            skin_tone, 
            gender, 
            distinguishing_marks, 
            storage_unit, 
            'Dfire1028'
        ]);
        connection.release();

        res.json({ 
            success: true, 
            message: `Body record saved successfully (ID: ${body_id})`,
            body_id: body_id
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Error saving record: ' + error.message });
    }
});

// GET - Fetch all body records
router.get('/all', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM bodies ORDER BY admission_date DESC'
        );
        connection.release();

        res.json({ 
            success: true, 
            data: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Error fetching records: ' + error.message });
    }
});

// GET - Fetch single body record by ID
router.get('/:body_id', async (req, res) => {
    const { body_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM bodies WHERE body_id = ?',
            [body_id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Record not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Error fetching record: ' + error.message });
    }
});

// PUT - Update body record
router.put('/update/:body_id', async (req, res) => {
    const { body_id } = req.params;
    const { height, weight, age, skin_tone, gender, distinguishing_marks, storage_unit } = req.body;

    try {
        const query = `
            UPDATE bodies 
            SET height = ?, weight = ?, age = ?, skin_tone = ?, gender = ?, distinguishing_marks = ?, storage_unit = ?
            WHERE body_id = ?
        `;
        
        const connection = await pool.getConnection();
        const [result] = await connection.execute(query, [
            height, weight, age, skin_tone, gender, distinguishing_marks, storage_unit, body_id
        ]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'Record not found' });
        }

        res.json({ success: true, message: 'Record updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Error updating record: ' + error.message });
    }
});

// DELETE - Delete body record
router.delete('/delete/:body_id', async (req, res) => {
    const { body_id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM bodies WHERE body_id = ?',
            [body_id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'Record not found' });
        }

        res.json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Error deleting record: ' + error.message });
    }
});

module.exports = router;