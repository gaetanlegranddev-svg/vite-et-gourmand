// ============================================
// Vite & Gourmand — Routes : /api/contact
// ============================================
import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { titre, description, email } = req.body;

  if (!titre || !description || !email) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  await sendMail({
    to: process.env.EMAIL_USER || 'gaetan.legrand.dev@gmail.com',
    subject: `[Contact] ${titre}`,
    html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>De :</strong> ${email}</p>
      <p><strong>Sujet :</strong> ${titre}</p>
      <p><strong>Message :</strong></p>
      <p>${description}</p>
    `
  });

  res.json({ message: 'Message envoyé avec succès.' });
}));

export default router;