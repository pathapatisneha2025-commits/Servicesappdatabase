const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool

// ==================
// ADD NEW COUPON
// ==================
router.post('/add', async (req, res) => {
  const { code, discount_percent, usage_limit, start_date, end_date } = req.body;

  try {
    // Check if code already exists
    const existing = await pool.query('SELECT * FROM servicesappcoupons WHERE code = $1', [code.toUpperCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const newCoupon = await pool.query(
      `INSERT INTO servicesappcoupons
      (code, discount_percent, usage_limit, used_count, start_date, end_date, is_active)
      VALUES ($1,$2,$3,0,$4,$5,true)
      RETURNING *`,
      [code.toUpperCase(), discount_percent, usage_limit, start_date || null, end_date || null]
    );

    res.status(201).json({ message: 'Coupon added successfully', coupon: newCoupon.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET ALL COUPONS
// ==================
router.get('/all', async (req, res) => {
  try {
    const coupons = await pool.query('SELECT * FROM servicesappcoupons ORDER BY id DESC');
    res.json({ total: coupons.rows.length, coupons: coupons.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET SINGLE COUPON BY ID
// ==================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await pool.query('SELECT * FROM servicesappcoupons WHERE id = $1', [id]);
    if (coupon.rows.length === 0) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// UPDATE COUPON
// ==================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { code, discount_percent, usage_limit, start_date, end_date, is_active } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE servicesappcoupons SET
      code = $1,
      discount_percent = $2,
      usage_limit = $3,
      start_date = $4,
      end_date = $5,
      is_active = $6
      WHERE id = $7
      RETURNING *`,
      [code.toUpperCase(), discount_percent, usage_limit, start_date || null, end_date || null, is_active, id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: 'Coupon not found' });

    res.json({ message: 'Coupon updated successfully', coupon: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// DELETE COUPON
// ==================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await pool.query('DELETE FROM servicesappcoupons WHERE id = $1 RETURNING *', [id]);
    if (deleted.rows.length === 0) return res.status(404).json({ message: 'Coupon not found' });

    res.json({ message: 'Coupon deleted successfully', coupon: deleted.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;