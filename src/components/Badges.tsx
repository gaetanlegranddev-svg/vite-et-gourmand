// ============================================
// Vite & Gourmand — Badges & Atoms Components
// ============================================
import { useState } from "react";
import { Leaf, Star } from "lucide-react";

type OrderStatus =
  | "en attente" | "accepté" | "en préparation"
  | "en cours de livraison" | "livré"
  | "en attente du retour de matériel" | "terminée" | "annulée";

const THEME_STYLES: Record<string,string> = { 
  "Noël":"bg-primary text-primary-foreground",
  "noel":"bg-primary text-primary-foreground",
  "Pâques":"bg-[#4A7C59] text-white",
  "paques":"bg-[#4A7C59] text-white",
  "classique":"bg-foreground text-background",
  "événement":"bg-accent text-accent-foreground",
  "evenement":"bg-accent text-accent-foreground" 
};

const STATUS_COLORS: Record<OrderStatus,string> = {
  "en attente":"bg-amber-100 text-amber-700 border-amber-300",
  "accepté":"bg-blue-100 text-blue-700 border-blue-300",
  "en préparation":"bg-violet-100 text-violet-700 border-violet-300",
  "en cours de livraison":"bg-orange-100 text-orange-700 border-orange-300",
  "livré":"bg-teal-100 text-teal-700 border-teal-300",
  "en attente du retour de matériel":"bg-rose-100 text-rose-700 border-rose-300",
  "terminée":"bg-emerald-100 text-emerald-700 border-emerald-300",
  "annulée":"bg-red-100 text-red-600 border-red-300",
};

const STATUS_LABELS: Record<OrderStatus,string> = {
  "en attente":"En attente","accepté":"Accepté","en préparation":"En préparation",
  "en cours de livraison":"En cours de livraison","livré":"Livré",
  "en attente du retour de matériel":"En attente du retour de matériel",
  "terminée":"Terminée","annulée":"Annulée",
};

export function ThemeBadge({ theme }: { theme: string }) { 
  return <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 font-medium ${THEME_STYLES[theme]}`}>{ {"noel":"Noël","paques":"Pâques","classique":"Classique","evenement":"Événement"}[theme] || theme}</span>; 
}

export function RegimeBadge({ regime }: { regime: string }) {
  if (regime === "classique") return null;
  const s: Record<string,string> = { classique:"",végétarien:"border border-emerald-400 text-emerald-700 bg-emerald-50",vegetarien:"border border-emerald-400 text-emerald-700 bg-emerald-50",vegan:"border border-emerald-600 text-emerald-800 bg-emerald-100","sans gluten":"border border-amber-400 text-amber-700 bg-amber-50",halal:"border border-blue-400 text-blue-700 bg-blue-50" };
  return <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 font-medium ${s[regime]}`}><Leaf size={9} className="inline mr-0.5" aria-hidden="true"/>{regime}</span>;
}

export function StockIndicator({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs text-red-600 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true"/>Épuisé</span>;
  if (stock <= 2)  return <span className="text-xs text-red-500 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" aria-hidden="true"/>{stock} restant{stock>1?"s":""}</span>;
  if (stock <= 5)  return <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" aria-hidden="true"/>{stock} disponibles</span>;
  return <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true"/>Disponible ({stock})</span>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`text-[11px] px-2.5 py-0.5 border font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function StarRating({ value, onChange, label = "Note" }: { value: number; onChange?: (v: number) => void; label?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label={label}>
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)} onMouseEnter={() => onChange && setHover(i)} onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"} aria-label={`${i} étoile${i>1?"s":""}`} aria-pressed={i<=value}>
          <Star size={20} className={`transition-colors ${i<=(hover||value)?"fill-accent text-accent":"text-border"}`} aria-hidden="true"/>
        </button>
      ))}
    </div>
  );
}

function validatePasswordLocal(pw: string): string[] {
  const e: string[] = [];
  if (pw.length < 10) e.push("10 caractères minimum");
  if (!/[A-Z]/.test(pw)) e.push("une majuscule");
  if (!/[a-z]/.test(pw)) e.push("une minuscule");
  if (!/[0-9]/.test(pw)) e.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("un caractère spécial");
  return e;
}

export function PasswordStrengthBar({ pw }: { pw: string }) {
  const validatePassword = validatePasswordLocal;
  if (!pw) return null;
  const s = 5 - validatePassword(pw).length;
  const c = ["","bg-red-500","bg-red-400","bg-amber-400","bg-emerald-400","bg-emerald-500"];
  const l = ["","Très faible","Faible","Moyen","Fort","Très fort"];
  const lc = ["","text-red-600","text-red-500","text-amber-600","text-emerald-600","text-emerald-600"];
  return <div className="space-y-1" aria-live="polite"><div className="flex gap-1" aria-hidden="true">{[1,2,3,4,5].map(i=><div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i<=s?c[s]:"bg-border"}`}/>)}</div><p className={`text-[11px] ${lc[s]}`}>Force du mot de passe : {l[s]}</p></div>;
}