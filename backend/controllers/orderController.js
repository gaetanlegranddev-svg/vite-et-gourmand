// ============================================
// Vite & Gourmand — Contrôleur : Commandes
// ============================================
import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import StatusHistory from '../models/StatusHistory.js';
import { sendMail } from '../utils/mailer.js';

const STATUSES = [
  'en attente',
  'accepté',
  'en préparation',
  'en cours de livraison',
  'livré',
  'en attente du retour de matériel',
  'terminée',
  'annulée',
];

// Écrit une entrée dans MongoDB sans jamais faire échouer la requête PostgreSQL
async function logStatus(orderId, status, note) {
  try {
    await StatusHistory.create({ order_id: orderId, status, at: new Date(), note });
  } catch (err) {
    console.error('⚠️ Historique de statut non enregistré :', err.message);
  }
}

// POST /api/orders — utilisateur connecté
export const createOrder = asyncHandler(async (req, res) => {
  const {
    menuId, firstName, lastName, email, phone, eventDate, deliveryTime,
    address, city, inBordeaux, distanceKm, people, menuSubtotal,
    deliveryFee, discount, total, notes, hasEquipmentLoan,
  } = req.body;

  if (
    !menuId || !firstName || !lastName || !email || !phone || !eventDate ||
    !deliveryTime || !address || !city || !people || !menuSubtotal || !total
  ) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders
      (user_id, menu_id, first_name, last_name, email, phone, event_date, delivery_time,
       address, city, in_bordeaux, distance_km, people, menu_subtotal, delivery_fee,
       discount, total, notes, has_equipment_loan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      req.user.id, menuId, firstName, lastName, email, phone, eventDate, deliveryTime,
      address, city, inBordeaux ?? true, distanceKm || 0, people, menuSubtotal,
      deliveryFee || 0, discount || 0, total, notes || null, hasEquipmentLoan || false,
    ]
  );

  const order = rows[0];
  await logStatus(order.id, order.current_status, 'Commande créée');

  sendMail({
    to: email,
    subject: 'Confirmation de votre commande — Vite & Gourmand',
    text: `Bonjour ${firstName}, votre commande du ${eventDate} a bien été enregistrée. Total : ${total} €.`,
  });

  res.status(201).json({ order });
});

// GET /api/orders/me — commandes de l'utilisateur connecté
export const getMyOrders = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ orders: rows });
});

// GET /api/orders — admin / employee, avec filtre optionnel ?status=
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];
  const values = [];
  if (status) {
    values.push(status);
    conditions.push(`current_status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC`,
    values
  );
  res.json({ orders: rows });
});

// GET /api/orders/:id — propriétaire ou staff
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  const order = rows[0];
  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  const isOwner = order.user_id === req.user.id;
  const isStaff = ['admin', 'employee'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  res.json({ order });
});

// PATCH /api/orders/:id/status — admin / employee
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  const { rows } = await pool.query(
    'UPDATE orders SET current_status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  const order = rows[0];
  await logStatus(order.id, status, note);

  sendMail({
    to: order.email,
    subject: 'Mise à jour de votre commande — Vite & Gourmand',
    text: `Bonjour ${order.first_name}, le statut de votre commande est désormais : ${status}.`,
  });

  res.json({ order });
});

// PATCH /api/orders/:id/cancel — propriétaire ou staff
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, contactMode } = req.body;

  const { rows: existing } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  const order = existing[0];
  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  const isOwner = order.user_id === req.user.id;
  const isStaff = ['admin', 'employee'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { rows } = await pool.query(
    `UPDATE orders
     SET current_status = 'annulée', cancellation_reason = $1, cancellation_contact_mode = $2
     WHERE id = $3
     RETURNING *`,
    [reason || null, contactMode || null, id]
  );

  await logStatus(id, 'annulée', reason);
  res.json({ order: rows[0] });
});

// POST /api/orders/:id/review — propriétaire, commande terminée uniquement
export const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Note requise entre 1 et 5.' });
  }

  const { rows: existing } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  const order = existing[0];
  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }
  if (order.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  if (order.current_status !== 'terminée') {
    return res.status(400).json({ message: 'La commande doit être terminée pour laisser un avis.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO reviews (order_id, rating, comment)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id) DO UPDATE SET rating = $2, comment = $3
     RETURNING *`,
    [id, rating, comment || null]
  );

  res.status(201).json({ review: rows[0] });
});

// GET /api/orders/:id/history — historique des statuts (MongoDB)
export const getOrderStatusHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await StatusHistory.find({ order_id: id }).sort({ at: 1 });
  res.json({ history });
});
