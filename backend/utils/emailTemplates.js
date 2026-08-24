// ============================================
// Vite & Gourmand — Email Templates
// ============================================

export const welcomeEmail = (firstName) => ({
  subject: 'Bienvenue chez Vite & Gourmand ! 🍽️',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #7A1C1C; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Vite & Gourmand</h1>
        <p style="color: #f0d0d0; margin: 5px 0;">Traiteur à Bordeaux depuis 1999</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Bonjour ${firstName} ! 👋</h2>
        <p>Nous sommes ravis de vous accueillir chez Vite & Gourmand.</p>
        <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
        <ul>
          <li>Consulter nos menus de saison</li>
          <li>Passer des commandes en ligne</li>
          <li>Suivre vos commandes en temps réel</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vite-et-gourmand-red.vercel.app" 
             style="background-color: #7A1C1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Découvrir nos menus
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 Vite & Gourmand — 12 rue des Chartrons, 33000 Bordeaux</p>
        <p>Données traitées conformément au RGPD</p>
      </div>
    </div>
  `
});

export const orderConfirmationEmail = (order) => ({
  subject: `Confirmation de votre commande — ${order.menuTitle}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #7A1C1C; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Vite & Gourmand</h1>
        <p style="color: #f0d0d0; margin: 5px 0;">Traiteur à Bordeaux depuis 1999</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Commande confirmée ! ✅</h2>
        <p>Bonjour ${order.firstName},</p>
        <p>Votre commande a bien été enregistrée. Voici le récapitulatif :</p>
        <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          <p><strong>Menu :</strong> ${order.menuTitle}</p>
          <p><strong>Date :</strong> ${new Date(order.eventDate).toLocaleDateString('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
          <p><strong>Heure :</strong> ${order.deliveryTime}</p>
          <p><strong>Adresse :</strong> ${order.address}, ${order.city}</p>
          <p><strong>Nombre de personnes :</strong> ${order.people}</p>
          <hr/>
          <p><strong>Total :</strong> ${Number(order.total).toFixed(2).replace('.', ',')} €</p>
        </div>
        <p>Nous reviendrons vers vous sous 24h pour confirmer votre commande.</p>
        <p>Pour toute question, contactez-nous au <strong>05 56 12 34 56</strong></p>
      </div>
      <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 Vite & Gourmand — 12 rue des Chartrons, 33000 Bordeaux</p>
      </div>
    </div>
  `
});

export const orderStatusEmail = (order, newStatus) => ({
  subject: `Mise à jour de votre commande — ${newStatus}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #7A1C1C; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Vite & Gourmand</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Mise à jour de votre commande</h2>
        <p>Bonjour ${order.firstName},</p>
        <p>Le statut de votre commande <strong>${order.menuTitle}</strong> a été mis à jour :</p>
        <div style="background: #7A1C1C; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <strong style="font-size: 18px;">${newStatus}</strong>
        </div>
        <p>Rendez-vous sur votre espace personnel pour suivre votre commande.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vite-et-gourmand-red.vercel.app" 
             style="background-color: #7A1C1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Suivre ma commande
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 Vite & Gourmand — 12 rue des Chartrons, 33000 Bordeaux</p>
      </div>
    </div>
  `
});