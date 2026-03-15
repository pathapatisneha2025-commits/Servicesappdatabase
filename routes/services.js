const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool connection

// ==================
// ADD SERVICE
// ==================
router.post('/add', async (req, res) => {
  const {
    name,
    icon,
    color,
    image_url,
    category,
    price,
    rating,
    reviews,
    is_popular
  } = req.body;

  try {
    const newService = await pool.query(
      `INSERT INTO servicesapp 
      (name, icon, color, image_url, category, price, rating, reviews, is_popular)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [name, icon, color, image_url, category, price, rating, reviews, is_popular]
    );

    res.status(201).json({
      message: 'Service added successfully',
      service: newService.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET ALL SERVICES
// ==================
router.get('/', async (req, res) => {
  try {
    const services = await pool.query('SELECT * FROM servicesapp ORDER BY id ASC');
    res.json({
      total: services.rows.length,
      services: services.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET POPULAR SERVICES
// ==================
router.get('/popular', async (req, res) => {
  try {
    const popularServices = await pool.query(
      'SELECT * FROM servicesapp WHERE is_popular = TRUE ORDER BY id ASC'
    );
    res.json({
      total: popularServices.rows.length,
      services: popularServices.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET SERVICE BY ID
// ==================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await pool.query('SELECT * FROM servicesapp WHERE id = $1', [id]);
    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;