// ============================================
// Vite & Gourmand — Configuration MongoDB
// ============================================

// Collection : status_history
// Historique des statuts de chaque commande
db.createCollection("status_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["order_id", "status", "at"],
      properties: {
        order_id: { bsonType: "string" },
        status: {
          bsonType: "string",
          enum: [
            "en attente", "accepté", "en préparation",
            "en cours de livraison", "livré",
            "en attente du retour de matériel", "terminée", "annulée"
          ]
        },
        at: { bsonType: "date" }
      }
    }
  }
});

// Collection : hour_slots
// Horaires d'ouverture du lundi au dimanche
db.createCollection("hour_slots");

db.hour_slots.insertMany([
  { day: "Lundi",    time: "8h – 19h" },
  { day: "Mardi",    time: "8h – 19h" },
  { day: "Mercredi", time: "8h – 19h" },
  { day: "Jeudi",    time: "8h – 19h" },
  { day: "Vendredi", time: "8h – 19h" },
  { day: "Samedi",   time: "9h – 18h" },
  { day: "Dimanche", time: "10h – 14h (sur commande)" }
]);

// Collection : sessions
// Tokens JWT de connexion utilisateur
db.createCollection("sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "token", "expires_at"],
      properties: {
        user_id: { bsonType: "string" },
        token:   { bsonType: "string" },
        expires_at: { bsonType: "date" }
      }
    }
  }
});

// Index TTL — supprime automatiquement les sessions expirées
db.sessions.createIndex(
  { expires_at: 1 },
  { expireAfterSeconds: 0 }
);

// Collection : statistics
// Statistiques des commandes par menu (pour les graphiques admin)
db.createCollection("statistics");

// Exemple de document statistique
db.statistics.insertOne({
  menu_id: "example-menu-id",
  menu_title: "Formule Noël Prestige",
  total_orders: 0,
  total_revenue: 0,
  updated_at: new Date()
});