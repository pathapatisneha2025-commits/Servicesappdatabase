// routes/reviews.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool

// POST /reviews/add
router.post('/add', async (req, res) => {
  const { customerId, serviceId, rating, comment } = req.body;

  if (!customerId || !serviceId || !rating) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // 1. Insert the review
    const insertQuery = `
      INSERT INTO service_reviews (customer_id, service_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const reviewResult = await pool.query(insertQuery, [customerId, serviceId, rating, comment]);

    // 2. Update service's average rating and total reviews in `servicesapp` table
    const avgQuery = `
      UPDATE servicesapp
      SET 
        rating = sub.avg_rating,
        reviews = sub.total_reviews,
        updated_at = NOW()
      FROM (
        SELECT 
          service_id,
          AVG(rating)::numeric(3,2) as avg_rating,
          COUNT(*) as total_reviews
        FROM service_reviews
        WHERE service_id = $1
        GROUP BY service_id
      ) AS sub
      WHERE servicesapp.id = sub.service_id
      RETURNING servicesapp.id, servicesapp.name, servicesapp.rating, servicesapp.reviews;
    `;

    const serviceUpdateResult = await pool.query(avgQuery, [serviceId]);

    res.status(200).json({
      message: 'Review added successfully',
      review: reviewResult.rows[0],
      updatedService: serviceUpdateResult.rows[0],
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;