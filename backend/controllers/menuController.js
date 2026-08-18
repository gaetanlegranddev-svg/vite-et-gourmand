// ============================================
// Vite & Gourmand — Contrôleur : Menus
// ============================================
import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/menus?theme=&regime=&people=&active=
export const getMenus = asyncHandler(async (req, res) => {
  const { theme, regime, people, active } = req.query;
  const conditions = [];
  const values = [];

  if (theme) {
    values.push(theme);
    conditions.push(`theme = $${values.length}`);
  }
  if (regime) {
    values.push(regime);
    conditions.push(`regime = $${values.length}`);
  }
  if (people) {
    values.push(Number(people));
    conditions.push(`min_people <= $${values.length}`);
  }
  // Par défaut on ne montre que les menus actifs (sauf si active=false explicitement demandé, ex. back-office)
  if (active !== 'false') {
    conditions.push('active = true');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM menus ${where} ORDER BY created_at DESC`,
    values
  );
  res.json({ menus: rows });
});

// GET /api/menus/:id — détail avec plats + allergènes
export const getMenuById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
  const menu = menuResult.rows[0];
  if (!menu) {
    return res.status(404).json({ message: 'Menu introuvable.' });
  }

  const dishesResult = await pool.query(
    `SELECT d.*,
       COALESCE(json_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '[]') AS allergens
     FROM dishes d
     JOIN menu_dishes md ON md.dish_id = d.id
     LEFT JOIN dish_allergens da ON da.dish_id = d.id
     LEFT JOIN allergens a ON a.id = da.allergen_id
     WHERE md.menu_id = $1
     GROUP BY d.id
     ORDER BY d.type, d.name`,
    [id]
  );

  res.json({ menu: { ...menu, dishes: dishesResult.rows } });
});

// POST /api/menus — admin uniquement
export const createMenu = asyncHandler(async (req, res) => {
  const {
    title, description, theme, regime, price, minPeople,
    stock, minOrderDays, conditions, storage, dishIds,
  } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: 'Titre et prix requis.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO menus
      (title, description, theme, regime, price, min_people, stock, min_order_days, conditions, storage)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      title,
      description || null,
      theme || 'classique',
      regime || 'classique',
      price,
      minPeople || 2,
      stock || 0,
      minOrderDays || 5,
      conditions || null,
      storage || null,
    ]
  );

  const menu = rows[0];

  if (Array.isArray(dishIds) && dishIds.length > 0) {
    const values = dishIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
      `INSERT INTO menu_dishes (menu_id, dish_id) VALUES ${values}`,
      [menu.id, ...dishIds]
    );
  }

  res.status(201).json({ menu });
});

// PUT /api/menus/:id — admin uniquement
export const updateMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  const allowedColumns = [
    'title', 'description', 'theme', 'regime', 'price', 'min_people',
    'stock', 'active', 'min_order_days', 'conditions', 'storage',
  ];
  // Le frontend envoie du camelCase, la BDD est en snake_case
  const keyMap = { minPeople: 'min_people', minOrderDays: 'min_order_days' };

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    const column = keyMap[key] || key;
    if (allowedColumns.includes(column)) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Aucun champ valide à mettre à jour.' });
  }

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE menus SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Menu introuvable.' });
  }

  res.json({ menu: rows[0] });
});

// DELETE /api/menus/:id — admin uniquement
// Désactivation logique plutôt que suppression (le menu peut être référencé par des commandes)
export const deleteMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'UPDATE menus SET active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Menu introuvable.' });
  }
  res.json({ message: 'Menu désactivé.', menu: rows[0] });
});

// GET /api/menus/meta/dishes
export const getDishes = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM dishes ORDER BY type, name');
  res.json({ dishes: rows });
});

// GET /api/menus/meta/allergens
export const getAllergens = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM allergens ORDER BY name');
  res.json({ allergens: rows });
});
