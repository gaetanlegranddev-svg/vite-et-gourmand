// ============================================
// Vite & Gourmand — Advance Status Modal
// ============================================
import { useState } from "react";
import { X, Truck, Package, ChevronRight as CR, Check, Box } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { StatusBadge } from "./Badges.tsx";
import { OrderStatus, STATUS_SEQUENCE, nextStatus } from "../utils/helpers.ts";

interface Order { id: string; currentStatus: OrderStatus; hasEquipmentLoan?: boolean; [key: string]: any; }

// ── Advance Status Modal ───────────────────────────────────────────────────────

export default function AdvanceStatusModal({ order, onClose, onConfirm }: { order:Order; onClose:()=>void; onConfirm:(next:OrderStatus,hasEquipment?:boolean)=>void }) {
  const [equipChoice, setEquipChoice] = useState<"none"|"equipment">("none");
  const isAfterLivred = order.currentStatus==="livré";
  const trapRef = useFocusTrap(true);
  const next = isAfterLivred ? (equipChoice==="equipment"?"en attente du retour de matériel":"terminée") : nextStatus(order.currentStatus,false);
  if (!next && !isAfterLivred) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Avancer le statut de la commande">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-md mx-4 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Avancer le statut</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="bg-secondary border border-border p-4 text-sm space-y-1">
          <p className="text-muted-foreground">Commande : <strong className="text-foreground">{order.firstName} {order.lastName}</strong></p>
          <p className="text-muted-foreground">Statut actuel : <StatusBadge status={order.currentStatus}/></p>
        </div>
        {isAfterLivred ? (
          <fieldset className="space-y-3"><legend className="text-sm text-muted-foreground">Du matériel a-t-il été prêté au client ?</legend>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className={`flex flex-col items-center gap-2 p-4 border cursor-pointer text-sm transition-colors ${equipChoice==="none"?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}><input type="radio" name="equip" value="none" checked={equipChoice==="none"} onChange={()=>setEquipChoice("none")} className="sr-only"/><Check size={20} className={equipChoice==="none"?"text-primary":"text-border"} aria-hidden="true"/><span>Sans prêt</span><span className="text-xs text-muted-foreground text-center">→ Terminée</span></label>
              <label className={`flex flex-col items-center gap-2 p-4 border cursor-pointer text-sm transition-colors ${equipChoice==="equipment"?"border-rose-500 bg-rose-50":"border-border hover:border-rose-300"}`}><input type="radio" name="equip" value="equipment" checked={equipChoice==="equipment"} onChange={()=>setEquipChoice("equipment")} className="sr-only"/><Box size={20} className={equipChoice==="equipment"?"text-rose-600":"text-border"} aria-hidden="true"/><span>Avec prêt</span><span className="text-xs text-muted-foreground text-center">→ Retour matériel</span></label>
            </div>
            {equipChoice==="equipment" && <div className="bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 leading-relaxed" role="note"><strong>Notification automatique :</strong> Le client recevra un e-mail l&apos;informant du délai de <strong>10 jours ouvrés</strong> pour restituer le matériel, faute de quoi <strong>600 € TTC</strong> lui seront facturés (CGV).</div>}
          </fieldset>
        ) : (
          <p className="text-sm text-muted-foreground">Prochain statut : <strong className="text-foreground ml-1"><StatusBadge status={next!}/></strong></p>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={()=>onConfirm(isAfterLivred?(equipChoice==="equipment"?"en attente du retour de matériel":"terminée"):next!,equipChoice==="equipment")} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center justify-center gap-2"><CR size={14} aria-hidden="true"/>Confirmer l&apos;avancement</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button>
        </div>
      </div>
    </div>
  );
}