-- ============================================
-- Vite & Gourmand — Correction des mots de passe de démo
-- ============================================
-- Les hashs insérés par database.sql ('$2b$10$hashedpassword_admin', etc.)
-- ne sont PAS de vrais hashs bcrypt : la connexion échouera tant que ce
-- script n'est pas exécuté. Il remplace ces valeurs par de vrais hashs
-- bcrypt (10 rounds) générés pour les mots de passe de démo fournis :
--   admin@viteetgourmand.fr   / Admin1234!
--   employe@viteetgourmand.fr / Employe1!
--   user@exemple.fr           / User1234!
--
-- À exécuter une fois, après avoir créé les tables (database.sql) :
--   psql -U postgres -d vite_gourmand -f fix-demo-passwords.sql

UPDATE users SET password = '$2b$10$.09c0Z7uicKLm/CFEiILEeEFt/8rxFHWpdv3HeYZ.sDi21gBLkT0a'
WHERE email = 'admin@viteetgourmand.fr';

UPDATE users SET password = '$2b$10$yuzq5eprx7E8vWqwhS/iZug1rM4OL6FuybMvKV6qIePXJB92/zEw6'
WHERE email = 'employe@viteetgourmand.fr';

UPDATE users SET password = '$2b$10$Z30i1KwTcFqPMCmd3RTjdepwaveinq0y0JluWmZMC7yijmbUkTxMO'
WHERE email = 'user@exemple.fr';
