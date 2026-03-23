// routes/bookings.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool connection


// ==================
// ADD NEW BOOKING
// ==================
router.post('/add', async (req, res) => {
  let {
    customerId,   // ✅ now coming from request
    serviceId,
    serviceName,
    price,
    date,
    time,
    address,
    status,
    coupon,
    discount,
    walletUsed
  } = req.body;

  // 1️⃣ Validate required fields
  if (!customerId || !serviceId || !serviceName || !price || !date || !time || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // 2️⃣ Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const formattedDate = parsedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // 3️⃣ Validate time (expecting "HH:MM:SS")
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM:SS (24-hour).' });
    }

    // 4️⃣ Insert into DB including coupon, discount, walletUsed
   const newBooking = await pool.query(
  `INSERT INTO serviceappbookings 
    (customer_id, service_id, service_name, price, date, time, address, status, coupon, discount, wallet_used) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
  [
    customerId,
    serviceId,
    serviceName,
    price,
    formattedDate,
    time,
    address,  // will now store as JSONB
    status || 'pending',
    coupon || null,
    discount || 0,
    walletUsed || 0
  ]
);
    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking.rows[0]
    });

  } catch (err) {
    console.error('Error creating booking:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
});
// ==================
// GET ALL BOOKINGS
// ==================
router.get('/all', async (req, res) => {
  try {
    const bookings = await pool.query(`
      SELECT 
        b.*, 
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        p.full_name AS provider_name,
        p.phone AS provider_phone
      FROM serviceappbookings b
      LEFT JOIN services_users c 
        ON b.customer_id = c.id
      LEFT JOIN servicesProvider_users p
        ON b.provider_id = p.id
      ORDER BY b.created_at DESC
    `);

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

router.get('/category/:serviceType', async (req, res) => {
  const { serviceType } = req.params;

  try {
    const bookings = await pool.query(
      'SELECT * FROM serviceappbookings  WHERE service_name = $1 ORDER BY date, time',
      [serviceType]
    );

    res.json({
      total: bookings.rows.length,
      bookings: bookings.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// UPDATE BOOKING STATUS (optional)
// ==================
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, provider_id } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    let updatedBooking;

    // If provider_id is provided, update both
    if (provider_id) {
      updatedBooking = await pool.query(
        'UPDATE serviceappbookings SET status = $1, provider_id = $2 WHERE id = $3 RETURNING *',
        [status, provider_id, id]
      );
    } else {
      updatedBooking = await pool.query(
        'UPDATE serviceappbookings SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
    }

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking.rows[0]
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ==================
// GET BOOKINGS BY CUSTOMER ID
// ==================
router.get('/customer/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    const bookings = await pool.query(
      'SELECT * FROM serviceappbookings WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    res.json({
      total: bookings.rows.length,
      bookings: bookings.rows
    });
  } catch (err) {
    console.error('Error fetching bookings for customer:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;