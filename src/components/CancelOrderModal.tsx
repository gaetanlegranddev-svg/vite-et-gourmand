// ============================================
// Vite & Gourmand — Cancel Order Modal
// ============================================
import { useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { X, Phone, Mail, AlertTriangle, Ban } from "lucide-react";

interface Order { id: string; menuTitle: string; [key: string]: any; }

// ── Cancel Order Modal ─────────────────────────────────────────────────────────

export default function CancelOrderModal({ order, onClose, onConfirm }: { order:Order; onClose:()=>void; onConfirm:(contactMode:string,reason:string)=>void }) {
  const [contactMode, setContactMode] = useState<"Téléphone"|"E-mail"|"">("");
  const [reason, setReason] = useState("");
  const trapRef = useFocusTrap(true);
  const ic = "bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Annuler la commande">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-lg mx-4 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-red-700" style={{fontFamily:"'Playfair Display',serif"}}>Annuler la commande</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 space-y-1.5" role="note">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle size={15} aria-hidden="true"/>Obligation de contact préalable</p>
          <p>Vous devez avoir contacté <strong>{order.firstName} {order.lastName}</strong> avant d&apos;annuler cette commande.</p>
        </div>
        <fieldset className="space-y-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Mode de contact utilisé *</legend><div className="flex gap-3 mt-2">{(["Téléphone","E-mail"] as const).map(m=><label key={m} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border cursor-pointer text-sm transition-colors ${contactMode===m?"border-primary bg-primary/5 text-primary":"border-border hover:border-primary/50"}`}><input type="radio" name="contact" value={m} checked={contactMode===m} onChange={()=>setContactMode(m)} className="sr-only"/>{m==="Téléphone"?<Phone size={14} aria-hidden="true"/>:<Mail size={14} aria-hidden="true"/>}{m}</label>)}</div></fieldset>
        <div className="flex flex-col gap-1.5"><label htmlFor="cancel-reason" className="text-xs tracking-widest uppercase text-muted-foreground">Motif de l&apos;annulation *</label><textarea id="cancel-reason" rows={3} value={reason} onChange={e=>setReason(e.target.value)} className={ic+" resize-none"} placeholder="Ex : Date indisponible, cuisine fermée ce jour..." aria-required="true"/></div>
        <div className="flex gap-3 pt-1">
          <button disabled={!contactMode||!reason.trim()} onClick={()=>onConfirm(contactMode,reason)} className="flex-1 py-2.5 bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2"><Ban size={14} aria-hidden="true"/>Confirmer l&apos;annulation</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Retour</button>
        </div>
      </div>
    </div>
  );
}
