// ============================================
// Vite & Gourmand — Helper Functions
// ============================================

export type OrderStatus =
  | "en attente" | "accepté" | "en préparation"
  | "en cours de livraison" | "livré"
  | "en attente du retour de matériel" | "terminée" | "annulée";

export interface StatusEntry { status: OrderStatus; at: string }

export const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
export const uid = () => "x" + Math.random().toString(36).slice(2, 8);
export const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}); } catch { return iso; } };
export const fmtDateShort = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}); } catch { return iso; } };
export const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}); } catch { return iso; } };

export function calcDeliveryFee(inBordeaux: boolean, km: number) { return inBordeaux ? 0 : 5 + 0.59 * km; }
export function calcDiscount(sub: number, minP: number, people: number) { return people >= minP + 5 ? sub * 0.1 : 0; }
export function validatePassword(pw: string): string[] {
  const e: string[] = [];
  if (pw.length < 10) e.push("10 caractères minimum");
  if (!/[A-Z]/.test(pw)) e.push("une majuscule");
  if (!/[a-z]/.test(pw)) e.push("une minuscule");
  if (!/[0-9]/.test(pw)) e.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("un caractère spécial");
  return e;
}

export const STATUS_SEQUENCE: OrderStatus[] = [
  "en attente","accepté","en préparation","en cours de livraison",
  "livré","en attente du retour de matériel","terminée"
];

export const STATUS_LABELS: Record<OrderStatus,string> = {
  "en attente":"En attente","accepté":"Accepté","en préparation":"En préparation",
  "en cours de livraison":"En cours de livraison","livré":"Livré",
  "en attente du retour de matériel":"En attente du retour de matériel",
  "terminée":"Terminée","annulée":"Annulée",
};

export const STATUS_COLORS: Record<OrderStatus,string> = {
  "en attente":"bg-amber-100 text-amber-700 border-amber-300",
  "accepté":"bg-blue-100 text-blue-700 border-blue-300",
  "en préparation":"bg-violet-100 text-violet-700 border-violet-300",
  "en cours de livraison":"bg-orange-100 text-orange-700 border-orange-300",
  "livré":"bg-teal-100 text-teal-700 border-teal-300",
  "en attente du retour de matériel":"bg-rose-100 text-rose-700 border-rose-300",
  "terminée":"bg-emerald-100 text-emerald-700 border-emerald-300",
  "annulée":"bg-red-100 text-red-600 border-red-300",
};

export const CHART_COLORS = ["#7A1C1C","#B8832A","#4A7C59","#3B6FA0","#8B5E3C","#5B3A7E"];

export function nextStatus(current: OrderStatus, hasEquipment: boolean): OrderStatus | null {
  const map: Partial<Record<OrderStatus,OrderStatus>> = {
    "en attente":"accepté","accepté":"en préparation","en préparation":"en cours de livraison","en cours de livraison":"livré",
    "en attente du retour de matériel":"terminée",
  };
  if (current === "livré") return hasEquipment ? "en attente du retour de matériel" : "terminée";
  return map[current] ?? null;
}
export function getDisabledEmails(): string[] { return JSON.parse(localStorage.getItem("vg_disabled") || "[]"); }
export function setDisabledEmails(list: string[]) { localStorage.setItem("vg_disabled", JSON.stringify(list)); }
export function allUsers(): any[] { 
  const SEED_USERS = [
    { id:"1", firstName:"Julie", lastName:"Martin", email:"admin@viteetgourmand.fr", role:"admin" },
    { id:"2", firstName:"José", lastName:"Fernandez", email:"employe@viteetgourmand.fr", role:"employee" },
    { id:"3", firstName:"Marie", lastName:"Dupont", email:"user@exemple.fr", role:"utilisateur" }
  ];
  return [...SEED_USERS, ...JSON.parse(sessionStorage.getItem("vg_users") || "[]")]; 
}