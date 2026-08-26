// ============================================
// Vite & Gourmand ÔÇö Contr├┤leur : Commandes
// ============================================
import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import StatusHistory from '../models/StatusHistory.js';
import { sendMail } from '../utils/mailer.js';
import { orderConfirmationEmail } from '../utils/emailTemplates.js';

const STATUSES = [
  'en attente',
  'accept├®',
  'en pr├®paration',
  'en cours de livraison',
  'livr├®',
  'en attente du retour de mat├®riel',
  'termin├®e',
  'annul├®e',
];

// ├ëcrit une entr├®e dans MongoDB sans jamais faire ├®chouer la requ├¬te PostgreSQL
async function logStatus(orderId, status, note) {
  try {
    await StatusHistory.create({ order_id: orderId, status, at: new Date(), note });
  } catch (err) {
    console.error('ÔÜá´©Å Historique de statut non enregistr├® :', err.message);
  }
}

// POST /api/orders ÔÇö utilisateur connect├®
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
     RETURNING *, (SELECT title FROM menus WHERE id = menu_id) as menu_title`,
    [
      req.user.id, menuId, firstName, lastName, email, phone, eventDate, deliveryTime,
      address, city, inBordeaux ?? true, distanceKm || 0, people, menuSubtotal,
      deliveryFee || 0, discount || 0, total, notes || null, hasEquipmentLoan || false,
    ]
  );

  const order = rows[0];
  await logStatus(order.id, order.current_status, 'Commande cr├®├®e');

  await sendMail({
    to: email,
    ...orderConfirmationEmail({ firstName, menuTitle: rows[0].menu_title || rows[0].menu_id, eventDate, deliveryTime, address, city, people, total })
  });
  res.status(201).json({ order });
});

// GET /api/orders/me ÔÇö commandes de l'utilisateur connect├®
export const getMyOrders = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ orders: rows });
});

// GET /api/orders ÔÇö admin / employee, avec filtre optionnel ?status=
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

// GET /api/orders/:id ÔÇö propri├®taire ou staff
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
    return res.status(403).json({ message: 'Acc├¿s refus├®.' });
  }

  res.json({ order });
});

// PATCH /api/orders/:id/status ÔÇö admin / employee
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
    subject: 'Mise ├á jour de votre commande ÔÇö Vite & Gourmand',
    text: `Bonjour ${order.first_name}, le statut de votre commande est d├®sormais : ${status}.`,
  });

  res.json({ order });
});

// PATCH /api/orders/:id/cancel ÔÇö propri├®taire ou staff
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
    return res.status(403).json({ message: 'Acc├¿s refus├®.' });
  }

  const { rows } = await pool.query(
    `UPDATE orders
     SET current_status = 'annul├®e', cancellation_reason = $1, cancellation_contact_mode = $2
     WHERE id = $3
     RETURNING *`,
    [reason || null, contactMode || null, id]
  );

  await logStatus(id, 'annul├®e', reason);
  res.json({ order: rows[0] });
});

// POST /api/orders/:id/review ÔÇö propri├®taire, commande termin├®e uniquement
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
    return res.status(403).json({ message: 'Acc├¿s refus├®.' });
  }
  if (order.current_status !== 'termin├®e') {
    return res.status(400).json({ message: 'La commande doit ├¬tre termin├®e pour laisser un avis.' });
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

// GET /api/orders/:id/history ÔÇö historique des statuts (MongoDB)
export const getOrderStatusHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await StatusHistory.find({ order_id: id }).sort({ at: 1 });
  res.json({ history });
});
