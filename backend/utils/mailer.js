// ============================================
// Vite & Gourmand — Envoi d'emails (Nodemailer)
// ============================================
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS,
  },
});

// L'envoi ne doit jamais faire planter une requête : on logue l'erreur
// au lieu de la propager si l'email échoue (SMTP mal configuré, etc.)
export async function sendMail({ to, subject, html, text }) {
  try {
    await transporter.sendMail({
      from: `"Vite & Gourmand" <${process.env.EMAIL_USER || 'gaetan.legrand.dev@gmail.com'}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error('⚠️ Erreur envoi email :', err.message);
  }
}
