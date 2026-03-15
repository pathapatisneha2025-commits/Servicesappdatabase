const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');


// ==================
// REGISTER
// ==================
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM services_users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if phone already exists
    const phoneCheck = await pool.query(
      'SELECT * FROM services_users WHERE phone = $1',
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO services_users 
      (full_name, email, phone, password) 
      VALUES ($1,$2,$3,$4) 
      RETURNING id, full_name, email, phone`,
      [fullName, email, phone, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ==================
// LOGIN (PHONE OR EMAIL)
// ==================
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  try {

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: 'Email or phone and password required' });
    }

    let userQuery;

    // Find user by email
    if (email) {
      userQuery = await pool.query(
        'SELECT * FROM services_users WHERE email = $1',
        [email]
      );
    }
    // Find user by phone
    else {
      userQuery = await pool.query(
        'SELECT * FROM services_users WHERE phone = $1',
        [phone]
      );
    }

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ==================
// GET ALL USERS
// ==================
router.get('/all', async (req, res) => {

  try {

    const users = await pool.query(
      'SELECT id, full_name, email, phone FROM services_users ORDER BY id DESC'
    );

    res.json({
      total: users.rows.length,
      users: users.rows
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Server error' });

  }

});


module.exports = router;