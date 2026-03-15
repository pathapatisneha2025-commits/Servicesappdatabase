// routes/bookings.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool connection

// ==================
// ADD NEW BOOKING
// ==================
router.post('/add', async (req, res) => {
  const { serviceId, serviceName, price, date, time, address, status } = req.body;

  if (!serviceId || !serviceName || !price || !date || !time || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newBooking = await pool.query(
      `INSERT INTO serviceappbookings 
        (service_id, service_name, price, date, time, address, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [serviceId, serviceName, price, date, time, address, status || 'pending'] // use default 'pending' if not provided
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking.rows[0]
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ==================
// GET ALL BOOKINGS
// ==================
router.get('/', async (req, res) => {
  try {
    const bookings = await pool.query('SELECT * FROM serviceappbookings ORDER BY created_at DESC');
    res.json({
      total: bookings.rows.length,
      bookings: bookings.rows
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET BOOKING BY ID
// ==================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await pool.query('SELECT * FROM serviceappbookings WHERE id = $1', [id]);

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking.rows[0]);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// UPDATE BOOKING STATUS (optional)
// ==================
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const updatedBooking = await pool.query(
      'UPDATE serviceappbookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated',
      booking: updatedBooking.rows[0]
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;