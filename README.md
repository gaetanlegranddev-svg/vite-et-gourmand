# Vite & Gourmand 🍽️

Application web pour le traiteur Vite & Gourmand — Bordeaux depuis 1999.

## 🌐 Application en ligne

- **Frontend** : https://vite-et-gourmand-red.vercel.app/
- **Backend API** : https://vite-gourmand-backend.onrender.com/

## 🛠️ Stack technique

- **Frontend** : React + TypeScript + Vite + TailwindCSS
- **Backend** : Node.js + Express
- **BDD Relationnelle** : PostgreSQL
- **BDD Non Relationnelle** : MongoDB
- **Auth** : JWT + bcryptjs
- **Déploiement** : Vercel + Render + MongoDB Atlas

## 🚀 Déploiement en local

### Prérequis
- Node.js v18+
- PostgreSQL 18+
- MongoDB 8+
- Git

### Installation

**1 — Cloner le projet**
```bash
git clone https://github.com/gaetanlegranddev-svg/vite-et-gourmand.git
cd vite-et-gourmand
```

**2 — Installer les dépendances**
```bash
npm install
```

**3 — Configurer les variables d'environnement**
```bash
cp backend/.env.example backend/.env
```
Remplissez les variables dans `backend/.env` :
```
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=vite_gourmand
PG_USER=postgres
PG_PASSWORD=votre_mot_de_passe
MONGO_URI=mongodb://localhost:27017/vite_gourmand
JWT_SECRET=votre_secret_jwt
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre@email.fr
EMAIL_PASS=votre_mot_de_passe_application
```

**4 — Créer la base de données PostgreSQL**
```bash
psql -U postgres -c "CREATE DATABASE vite_gourmand;"
psql -U postgres -d vite_gourmand -f database.sql
```

**5 — Lancer le backend**
```bash
node backend/server.js
```

**6 — Lancer le frontend**
```bash
npm run dev
```

Le site est accessible sur **http://localhost:5173**

## 👥 Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@viteetgourmand.fr | Admin1234! |
| Employé | employe@viteetgourmand.fr | Employe1! |
| Client | user@exemple.fr | User1234! |

## 📁 Structure du projet

```
vite-et-gourmand/
├── backend/
│   ├── config/         → Configuration PostgreSQL
│   ├── controllers/    → Logique métier
│   ├── middleware/     → Authentification JWT
│   ├── models/         → Schémas MongoDB
│   ├── routes/         → Endpoints API
│   ├── utils/          → Mailer, asyncHandler
│   └── server.js       → Point d'entrée
├── src/
│   ├── app/            → Composants React
│   ├── context/        → AuthContext
│   ├── services/       → Appels API
│   └── styles/         → CSS
├── database.sql        → Schéma PostgreSQL
└── README.md
```

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- Authentification **JWT** (expiration 24h)
- **CORS** configuré pour Vercel uniquement
- Variables sensibles en **variables d'environnement**
- **SSL** activé pour PostgreSQL en production
- Validation des données côté backend