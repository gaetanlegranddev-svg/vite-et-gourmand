// ============================================
// Vite & Gourmand — Review Modal Component
// ============================================
import { useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { StarRating } from "./Badges.tsx";

interface Order {
  menuTitle: string;
  eventDate: string;
  [key: string]: any;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });
}

interface ReviewModalProps {
  order: Order;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function ReviewModal({ order, onClose, onSubmit }: ReviewModalProps) {
  const [rating,setRating]=useState(5); 
  const [comment,setComment]=useState("");
  const trapRef=useFocusTrap(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Donner mon avis">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-md mx-4 shadow-2xl p-8 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Donner mon avis</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="bg-secondary p-3 text-sm"><p className="font-medium">{order.menuTitle}</p><p className="text-xs text-muted-foreground mt-0.5">Prestation du {fmtDate(order.eventDate)}</p></div>
        <div className="space-y-2"><StarRating value={rating} onChange={setRating} label="Votre note de 1 à 5 étoiles"/><p className="text-xs text-muted-foreground" aria-live="polite">{["","Très insatisfait","Insatisfait","Moyen","Satisfait","Très satisfait"][rating]}</p></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="review-comment" className="text-xs tracking-widest uppercase text-muted-foreground">Commentaire</label><textarea id="review-comment" rows={4} value={comment} onChange={e=>setComment(e.target.value)} className="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Partagez votre expérience..."/></div>
        <button onClick={()=>onSubmit(rating,comment)} className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Soumettre mon avis</button>
      </div>
    </div>
  );
}