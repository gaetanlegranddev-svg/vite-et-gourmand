// ============================================
// Vite & Gourmand — Wrapper pour gérer les erreurs
// des contrôleurs async sans try/catch répété
// ============================================
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
