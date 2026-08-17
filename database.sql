-- ============================================
-- Vite & Gourmand — Base de données PostgreSQL
-- ============================================

-- Rôles
CREATE TYPE user_role AS ENUM ('utilisateur', 'employee', 'admin');
CREATE TYPE dish_type AS ENUM ('entrée', 'plat', 'dessert');
CREATE TYPE order_status AS ENUM (
  'en attente', 'accepté', 'en préparation',
  'en cours de livraison', 'livré',
  'en attente du retour de matériel', 'terminée', 'annulée'
);
CREATE TYPE menu_theme AS ENUM ('Noël', 'Pâques', 'classique', 'événement');
CREATE TYPE menu_regime AS ENUM ('classique', 'végétarien', 'vegan', 'sans gluten', 'halal');

-- ============================================
-- Table : users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'utilisateur',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table : menus
-- ============================================
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  theme menu_theme NOT NULL DEFAULT 'classique',
  regime menu_regime NOT NULL DEFAULT 'classique',
  price DECIMAL(10,2) NOT NULL,
  min_people INT NOT NULL DEFAULT 2,
  stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  min_order_days INT NOT NULL DEFAULT 5,
  conditions TEXT,
  storage TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table : dishes
-- ============================================
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type dish_type NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table : allergens
-- ============================================
CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================
-- Table pivot : dish_allergens
-- ============================================
CREATE TABLE dish_allergens (
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (dish_id, allergen_id)
);

-- ============================================
-- Table pivot : menu_dishes
-- ============================================
CREATE TABLE menu_dishes (
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_id, dish_id)
);

-- ============================================
-- Table : orders
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  menu_id UUID NOT NULL REFERENCES menus(id),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  in_bordeaux BOOLEAN NOT NULL DEFAULT TRUE,
  distance_km DECIMAL(5,2) DEFAULT 0,
  people INT NOT NULL,
  menu_subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  current_status order_status NOT NULL DEFAULT 'en attente',
  has_equipment_loan BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  cancellation_contact_mode VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table : reviews
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  validated BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Données initiales : allergènes (14 UE)
-- ============================================
INSERT INTO allergens (name) VALUES
  ('Gluten'), ('Crustacés'), ('Œufs'), ('Poissons'),
  ('Arachides'), ('Soja'), ('Lait'), ('Fruits à coque'),
  ('Céleri'), ('Moutarde'), ('Graines de sésame'),
  ('Sulfites'), ('Lupin'), ('Mollusques');

-- ============================================
-- Données initiales : utilisateurs de démo
-- ============================================
INSERT INTO users (first_name, last_name, email, phone, address, password, role) VALUES
  ('Julie', 'Martin', 'admin@viteetgourmand.fr', '0556123456',
   '12 rue des Chartrons, 33000 Bordeaux',
   '$2b$10$hashedpassword_admin', 'admin'),
  ('José', 'Fernandez', 'employe@viteetgourmand.fr', '0612345678',
   '8 allée de Tourny, 33000 Bordeaux',
   '$2b$10$hashedpassword_employe', 'employee'),
  ('Marie', 'Dupont', 'user@exemple.fr', '0698765432',
   '3 place de la Victoire, 33000 Bordeaux',
   '$2b$10$hashedpassword_user', 'utilisateur');