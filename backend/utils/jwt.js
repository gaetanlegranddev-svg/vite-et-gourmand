// ============================================
// Vite & Gourmand — Génération des tokens JWT
// ============================================
import jwt from 'jsonwebtoken';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
