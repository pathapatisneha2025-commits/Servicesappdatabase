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
    const emailCheck = await pool.query('SELECT * FROM services_users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const phoneCheck = await pool.query('SELECT * FROM services_users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) return res.status(400).json({ message: 'Phone already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user with wallet balance 0
    const newUser = await pool.query(
      `INSERT INTO services_users 
        (full_name, email, phone, password, wallet_balance) 
       VALUES ($1,$2,$3,$4,0)
       RETURNING wallet_balance`,
      [fullName, email, phone, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', wallet: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    if ((!email && !phone) || !password) 
      return res.status(400).json({ message: 'Email or phone and password required' });

    const userQuery = email
      ? await pool.query('SELECT * FROM services_users WHERE email = $1', [email])
      : await pool.query('SELECT * FROM services_users WHERE phone = $1', [phone]);

    if (userQuery.rows.length === 0) 
      return res.status(400).json({ message: 'Invalid credentials' });

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Just return wallet_balance set by admin
    res.json({
      message: 'Login successful',
      wallet_balance: user.wallet_balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ==================
// GET WALLET INFO BY USER ID
// ==================
router.get('/:id/wallet', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await pool.query('SELECT wallet_balance FROM services_users WHERE id = $1', [id]);
    if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// UPDATE WALLET FOR ALL USERS
// ==================
router.put('/wallet', async (req, res) => {
  const { amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE services_users
       SET wallet_balance = $1
       RETURNING id`
      , [amount]
    );
    res.json({ message: 'Wallet updated successfully', updatedCount: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;