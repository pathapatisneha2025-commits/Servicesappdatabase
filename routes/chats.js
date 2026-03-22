// routes/chats.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool

// ==============================
// POST /chats/send
// Send a new chat message
// ==============================
router.post('/send', async (req, res) => {
  const { booking_id, sender_id, sender_role, message } = req.body;

  if (!booking_id || !sender_id || !sender_role || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Insert message into chats table
    const result = await pool.query(
      `INSERT INTO chats (booking_id, sender_id, sender_role, message, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [booking_id, sender_id, sender_role, message]
    );

    res.status(200).json({
      message: 'Message sent successfully',
      chat: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// GET /chats/:bookingId
// Get all chat messages for a booking
// ==============================
router.get('/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM chats
       WHERE booking_id = $1
       ORDER BY created_at ASC`,
      [bookingId]
    );

    res.status(200).json({
      message: 'Messages fetched successfully',
      messages: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;