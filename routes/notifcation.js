// routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool

// POST /notifications - create a new notification
router.post('/add', async (req, res) => {
  const { customer_id, title, message } = req.body;

  if (!customer_id || !title || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notifications (customer_id, title, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [customer_id, title, message]
    );
    res.status(201).json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /notifications/:customerId - get all notifications for a customer
router.get('/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    res.status(200).json({ success: true, notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optional: mark a notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;