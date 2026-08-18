// ============================================
// Contrôleur d'authentification
// ============================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

// ── Inscription ─────────────────────────────
export const inscription = async (req, res) => {
  const { firstName, lastName, email, phone, address, password } = req.body;
  try {
    const existe = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, address, password, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'utilisateur') RETURNING id, email, role`,
      [firstName, lastName, email, phone, address, hash]
    );
    res.status(201).json({ message: 'Compte créé avec succès', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Connexion ────────────────────────────────
export const connexion = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true', [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    const user = result.rows[0];
    const valide = await bcrypt.compare(password, user.password);
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Connexion réussie',
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
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Profil ───────────────────────────────────
export const profil = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, address, role 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};