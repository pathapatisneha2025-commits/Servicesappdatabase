const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');

// ==================
// Multer + Cloudinary setup
// ==================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'kyc_docs',
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

const parser = multer({ storage });

// ==================
// REGISTER PROVIDER
// ==================
router.post('/register', parser.fields([{ name: 'aadhaar' }, { name: 'pan' }]), async (req, res) => {
  const { fullName, email, phone, password, serviceType } = req.body;

  try {
    // Email check
    const emailCheck = await pool.query('SELECT * FROM servicesProvider_users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });

    // Phone check
    const phoneCheck = await pool.query('SELECT * FROM servicesProvider_users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) return res.status(400).json({ message: 'Phone already registered' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cloudinary URLs
    const aadhaarUrl = req.files['aadhaar'][0].path;
    const panUrl = req.files['pan'][0].path;

    // Insert provider
    const newProvider = await pool.query(
      `INSERT INTO servicesProvider_users 
      (full_name, email, phone, password, service_type, aadhaar_url, pan_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, full_name, email, phone, service_type, aadhaar_url, pan_url`,
      [fullName, email, phone, hashedPassword, serviceType, aadhaarUrl, panUrl]
    );

    res.status(201).json({
      message: 'Provider registered successfully',
      provider: newProvider.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================
// LOGIN PROVIDER (Email or Phone)
// ==================
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    if ((!email && !phone) || !password) return res.status(400).json({ message: 'Email or phone and password required' });

    let userQuery;
    if (email) userQuery = await pool.query('SELECT * FROM servicesProvider_users WHERE email = $1', [email]);
    else userQuery = await pool.query('SELECT * FROM servicesProvider_users WHERE phone = $1', [phone]);

    if (userQuery.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      message: 'Login successful',
      provider: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        serviceType: user.service_type,
        aadhaarUrl: user.aadhaar_url,
        panUrl: user.pan_url,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET ALL PROVIDERS
// ==================
router.get('/all', async (req, res) => {
  try {
    const providers = await pool.query(
      'SELECT id, full_name, email, phone, service_type, aadhaar_url, pan_url,status FROM servicesProvider_users ORDER BY id DESC'
    );
    res.json({ total: providers.rows.length, providers: providers.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================
// GET PROVIDER BY ID
// ==================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const provider = await pool.query(
      'SELECT id, full_name, email, phone, service_type, aadhaar_url, pan_url FROM servicesProvider_users WHERE id = $1',
      [id]
    );
    if (provider.rows.length === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json(provider.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;