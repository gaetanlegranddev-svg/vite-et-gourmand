// ============================================
// Vite & Gourmand — Auth Controller
// ============================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

// ── Register ─────────────────────────────────
export const register = async (req, res) => {
  const { firstName, lastName, email, phone, address, password } = req.body;
  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, address, password, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'utilisateur') RETURNING id, email, role`,
      [firstName, lastName, email, phone, address, hash]
    );
    res.status(201).json({ message: 'Account created successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Login ────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true', [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get profile ──────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, address, role 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Update profile ───────────────────────────
export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET first_name=$1, last_name=$2, phone=$3, address=$4
       WHERE id=$5 RETURNING id, first_name, last_name, email, phone, address, role`,
      [firstName, lastName, phone, address, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};