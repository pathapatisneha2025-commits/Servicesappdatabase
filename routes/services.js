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
    image_url,
    category,
    price,
    rating,
    reviews,
    is_popular,
    description
  } = req.body;

  try {
    const newService = await pool.query(
      `INSERT INTO servicesapp 
      (name, icon, color, image_url, category, price, rating, reviews, is_popular, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [name, icon,  image_url, category, price, rating, reviews, is_popular, description]
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
router.get('/all', async (req, res) => {
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

// ==================
// UPDATE SERVICE
// ==================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    icon,
    color,
    image_url,
    category,
    price,
    rating,
    reviews,
    is_popular,
    description
  } = req.body;

  try {
    const updatedService = await pool.query(
      `UPDATE servicesapp 
       SET name = $1,
           icon = $2,
           color = $3,
           image_url = $4,
           category = $5,
           price = $6,
           rating = $7,
           reviews = $8,
           is_popular = $9,
           description = $10
       WHERE id = $11
       RETURNING *`,
      [name, icon, color, image_url, category, price, rating, reviews, is_popular, description, id]
    );

    if (updatedService.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: 'Service updated successfully',
      service: updatedService.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// DELETE SERVICE
// ==================
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedService = await pool.query(
      'DELETE FROM servicesapp WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedService.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: 'Service deleted successfully',
      service: deletedService.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;