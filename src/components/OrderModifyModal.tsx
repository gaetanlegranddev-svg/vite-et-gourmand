// ============================================
// Vite & Gourmand — Order Modify Modal
// ============================================
import { useState } from "react";
import { X, Edit2, Info, Minus, Plus, Check } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { calcDiscount, calcDeliveryFee, fmt } from "../utils/helpers.ts";


interface Order { id: string; eventDate: string; deliveryTime: string; address: string; city: string; notes: string; [key: string]: any; }

// ── Order Modify Modal ─────────────────────────────────────────────────────────

export default function OrderModifyModal({ order, onClose, onSave }: { order:Order; onClose:()=>void; onSave:(partial:Partial<Order>)=>void }) {
  const [f,setF]=useState({ eventDate:order.eventDate,deliveryTime:order.deliveryTime,address:order.address,city:order.city,notes:order.notes,people:order.people,inBordeaux:order.inBordeaux,distanceKm:String(order.distanceKm) });
  const ic="w-full bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const trapRef=useFocusTrap(true);
  function handleSave(){ const ppp=order.menuSubtotal/order.people; const sub=+(ppp*f.people).toFixed(2); const disc=+(calcDiscount(sub,order.menuMinPeople,f.people)).toFixed(2); const fee=+(calcDeliveryFee(f.inBordeaux,+f.distanceKm||0)).toFixed(2); onSave({ eventDate:f.eventDate,deliveryTime:f.deliveryTime,address:f.address,city:f.city,notes:f.notes,people:f.people,inBordeaux:f.inBordeaux,distanceKm:+f.distanceKm||0,menuSubtotal:sub,discount:disc,deliveryFee:fee,total:+(sub-disc+fee).toFixed(2) }); onClose(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Modifier la commande">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Modifier la commande</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="bg-secondary border border-border p-3 text-xs text-muted-foreground flex items-center gap-2"><Info size={12} aria-hidden="true"/>Le choix du menu ne peut pas être modifié.</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-date" className="text-xs tracking-widest uppercase text-muted-foreground">Date</label><input id="mod-date" type="date" value={f.eventDate} onChange={e=>setF(x=>({...x,eventDate:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-time" className="text-xs tracking-widest uppercase text-muted-foreground">Heure</label><input id="mod-time" type="time" value={f.deliveryTime} onChange={e=>setF(x=>({...x,deliveryTime:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse</label><input id="mod-addr" value={f.address} onChange={e=>setF(x=>({...x,address:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-city" className="text-xs tracking-widest uppercase text-muted-foreground">Ville</label><input id="mod-city" value={f.city} onChange={e=>setF(x=>({...x,city:e.target.value}))} className={ic}/></div>
            <fieldset className="flex flex-col gap-1.5 sm:col-span-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Bordeaux ?</legend><div className="flex gap-4 mt-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="mod-bordeaux" checked={f.inBordeaux} onChange={()=>setF(x=>({...x,inBordeaux:true,distanceKm:"0"}))}/>Oui</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="mod-bordeaux" checked={!f.inBordeaux} onChange={()=>setF(x=>({...x,inBordeaux:false}))}/>Non</label></div></fieldset>
            {!f.inBordeaux&&<div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="mod-km" className="text-xs tracking-widest uppercase text-muted-foreground">Distance (km)</label><input id="mod-km" type="number" min={1} value={f.distanceKm} onChange={e=>setF(x=>({...x,distanceKm:e.target.value}))} className={ic}/></div>}
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label className="text-xs tracking-widest uppercase text-muted-foreground" id="mod-people-lbl">Personnes</label><div className="flex items-center gap-3" role="group" aria-labelledby="mod-people-lbl"><button type="button" onClick={()=>setF(x=>({...x,people:Math.max(order.menuMinPeople,x.people-1)}))} aria-label="Retirer une personne" className="w-9 h-9 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={13} aria-hidden="true"/></button><span className="text-xl font-semibold w-8 text-center" aria-live="polite">{f.people}</span><button type="button" onClick={()=>setF(x=>({...x,people:x.people+1}))} aria-label="Ajouter une personne" className="w-9 h-9 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={13} aria-hidden="true"/></button></div></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="mod-notes" className="text-xs tracking-widest uppercase text-muted-foreground">Notes</label><textarea id="mod-notes" rows={2} value={f.notes} onChange={e=>setF(x=>({...x,notes:e.target.value}))} className={ic+" resize-none"}/></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0"><button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Enregistrer</button><button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button></div>
      </div>
    </div>
  );
}