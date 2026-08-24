// ============================================
// Vite & Gourmand — Auth Middleware
// ============================================
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied — missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'viteGourmand2026SecretJWT!');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied — insufficient rights' });
    }
    next();
  };
};