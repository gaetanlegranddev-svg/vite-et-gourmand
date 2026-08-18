// ============================================
// Middleware d'authentification JWT
// ============================================
import jwt from 'jsonwebtoken';

export const verifierToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé — token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

export const verifierRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé — droits insuffisants' });
    }
    next();
  };
};

// ── Aliases pour compatibilité ───────────────
export const authenticate = verifierToken;
export const authorize = verifierRole;