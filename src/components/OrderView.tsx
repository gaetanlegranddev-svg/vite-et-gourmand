// ============================================
// Vite & Gourmand — Order View Component
// ============================================
import { useState, useMemo } from "react";
import { ArrowLeft, Check, CircleCheck, AlertTriangle, Info, ShoppingCart, Lock, ChevronRight as CR, Plus, Minus } from "lucide-react";
import { createOrder } from "../services/orderService.js";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);


interface MenuData {
  id: string; title: string; images: string[]; price: number;
  minPeople: number; min_people: number; minOrderDays: number;
  min_order_days: number; conditions: string; regime: string;
  theme: string; stock: number; active: boolean;
}
interface AuthUser { name: string; email: string; role: string; phone?: string; address?: string; }
interface Order { [key: string]: any; }

const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });

function calcDiscount(sub: number, min: number, people: number) {
  return people >= min + 5 ? sub * 0.1 : 0;
}
function calcDeliveryFee(inBordeaux: boolean, km: number) {
  return inBordeaux ? 5 : 5 + km * 0.59;
}

export default function OrderView({ menu, user, onBack, onConfirm }: { menu:MenuData; user:AuthUser; onBack:()=>void; onConfirm:(order:Order)=>void }) {
  const [step, setStep] = useState(1);
  const np=user.name.split(" ");
  const [s1,setS1]=useState({ firstName:np[0]||"",lastName:np.slice(1).join(" ")||"",email:user.email,phone:user.phone||"",eventDate:"",deliveryTime:"12:00",address:user.address?.split(",")[0]?.trim()||"",city:"Bordeaux",inBordeaux:true,distanceKm:"0",notes:"" });
  const [people,setPeople]=useState((menu.minPeople || menu.min_people || 4));
  const [agreed,setAgreed]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const menuSub=+((menu.price/(menu.minPeople || menu.min_people || 4))*people).toFixed(2);
  const discount=+(calcDiscount(menuSub,(menu.minPeople || menu.min_people || 4),people)).toFixed(2);
  const delivFee=+(calcDeliveryFee(s1.inBordeaux,+s1.distanceKm||0)).toFixed(2);
  const total=+(menuSub-discount+delivFee).toFixed(2);
  const hasDiscount=people>=(menu.minPeople || menu.min_people || 4)+5;
  const ic="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const steps=["Livraison","Menu & personnes","Récapitulatif"];

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (menu.minOrderDays || 5) + 3);
    return d.toISOString().split("T")[0];
  }, [menu.minOrderDays]);

  const tooFar = !s1.inBordeaux && +s1.distanceKm >= 50;

  async function handleConfirm(e:React.FormEvent){
    e.preventDefault(); if(!agreed)return;
    const order:Order={ id:uid(),userEmail:user.email,menuId:menu.id,menuTitle:menu.title,menuImage:(menu.images?.[0] || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format'),menuMinPeople:(menu.minPeople || menu.min_people || 4),firstName:s1.firstName,lastName:s1.lastName,email:s1.email,phone:s1.phone,eventDate:s1.eventDate,deliveryTime:s1.deliveryTime,address:s1.address,city:s1.city,inBordeaux:s1.inBordeaux,distanceKm:+s1.distanceKm||0,people,menuSubtotal:menuSub,deliveryFee:delivFee,discount,total,notes:s1.notes,statusHistory:[{status:"en attente",at:new Date().toISOString()}],currentStatus:"en attente" };
    try {
      await createOrder({ menuId:menu.id,firstName:s1.firstName,lastName:s1.lastName,email:s1.email,phone:s1.phone,eventDate:s1.eventDate,deliveryTime:s1.deliveryTime,address:s1.address,city:s1.city,inBordeaux:s1.inBordeaux,distanceKm:+s1.distanceKm||0,people,menuSubtotal:menuSub,deliveryFee:delivFee,discount,total,notes:s1.notes });
    } catch(err) { console.error(err); }
    onConfirm(order);
    setConfirmed(true);
  }

  if(confirmed) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6" role="status" aria-live="polite">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CircleCheck size={32} className="text-emerald-600" aria-hidden="true"/></div>
      <h2 className="text-3xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Commande confirmée !</h2>
      <p className="text-muted-foreground leading-relaxed">Merci {s1.firstName} ! Votre commande pour <strong>{menu.title}</strong> le <strong>{fmtDate(s1.eventDate)}</strong> est enregistrée. Un e-mail de confirmation a été envoyé à <strong>{s1.email}</strong>.</p>
      <div className="bg-secondary border border-border p-5 text-left text-sm space-y-2"><p><strong>Menu :</strong> {menu.title}</p><p><strong>Date :</strong> {fmtDate(s1.eventDate)} à {s1.deliveryTime}</p><p><strong>Livraison :</strong> {s1.address}, {s1.city}</p><p><strong>Personnes :</strong> {people}</p><p><strong>Total :</strong> {fmt(total)}</p></div>
      <button onClick={onBack} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90">Voir mes commandes</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft size={14} aria-hidden="true"/>Retour</button>
      <p className="text-xs tracking-widest uppercase text-accent mb-2">Commande</p>
      <h1 className="text-3xl font-semibold mb-8" style={{fontFamily:"'Playfair Display',serif"}}>Commander un menu</h1>
      <ol className="flex items-center mb-10" aria-label="Étapes de la commande">
        {steps.map((s,i)=>(
          <li key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step>i+1?"bg-accent text-accent-foreground":step===i+1?"bg-primary text-primary-foreground":"bg-secondary text-muted-foreground"}`} aria-current={step===i+1?"step":undefined}>{step>i+1?<Check size={14} aria-hidden="true"/>:i+1}</div><p className={`text-[10px] mt-1 uppercase tracking-wider whitespace-nowrap ${step===i+1?"text-foreground":"text-muted-foreground"}`}>{s}</p></div>
            {i<steps.length-1&&<div className={`flex-1 h-px mx-2 mb-5 transition-colors ${step>i+1?"bg-accent":"bg-border"}`} aria-hidden="true"/>}
          </li>
        ))}
      </ol>

      {step===1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Informations de livraison</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="o-fn" className="text-xs tracking-widest uppercase text-muted-foreground">Prénom *</label><input id="o-fn" required value={s1.firstName} onChange={e=>setS1(f=>({...f,firstName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-ln" className="text-xs tracking-widest uppercase text-muted-foreground">Nom *</label><input id="o-ln" required value={s1.lastName} onChange={e=>setS1(f=>({...f,lastName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail *</label><input id="o-email" type="email" required value={s1.email} onChange={e=>setS1(f=>({...f,email:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-phone" className="text-xs tracking-widest uppercase text-muted-foreground">Téléphone *</label><input id="o-phone" type="tel" required value={s1.phone} onChange={e=>setS1(f=>({...f,phone:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-date" className="text-xs tracking-widest uppercase text-muted-foreground">Date de la prestation *</label><input id="o-date" type="date" required min={minDate} value={s1.eventDate} onChange={e=>setS1(f=>({...f,eventDate:e.target.value}))} className={ic}/><p className="text-[11px] text-muted-foreground">Date au plus tôt : <strong>{fmtDate(minDate)}</strong> (délai minimum {menu.minOrderDays + 3} jours)</p></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-time" className="text-xs tracking-widest uppercase text-muted-foreground">Heure de livraison *</label><input id="o-time" type="time" required value={s1.deliveryTime} onChange={e=>setS1(f=>({...f,deliveryTime:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse de livraison *</label><input id="o-addr" required value={s1.address} onChange={e=>setS1(f=>({...f,address:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-city" className="text-xs tracking-widest uppercase text-muted-foreground">Ville *</label><input id="o-city" required value={s1.city} onChange={e=>setS1(f=>({...f,city:e.target.value}))} className={ic}/></div>
            <fieldset className="flex flex-col gap-1.5 justify-end"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Livraison à Bordeaux ?</legend><div className="flex gap-4 pt-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="bordeaux" checked={s1.inBordeaux} onChange={()=>setS1(f=>({...f,inBordeaux:true,distanceKm:"0"}))}/>Oui</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="bordeaux" checked={!s1.inBordeaux} onChange={()=>setS1(f=>({...f,inBordeaux:false}))}/>Non</label></div></fieldset>
            {!s1.inBordeaux&&<div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-km" className="text-xs tracking-widest uppercase text-muted-foreground">Distance depuis Bordeaux (km) *</label><input id="o-km" type="number" min={1} max={499} required value={s1.distanceKm} onChange={e=>setS1(f=>({...f,distanceKm:e.target.value}))} className={ic}/>{tooFar?<div className="flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 text-sm" role="alert"><AlertTriangle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true"/><p>La livraison n&apos;est pas disponible au-delà de 50 km. <a href="#contact" onClick={e=>{e.preventDefault();}} className="underline font-medium">Contactez-nous</a> pour un devis personnalisé de votre événement.</p></div>:<p className="text-[11px] text-muted-foreground" aria-live="polite"><Truck size={11} className="inline mr-1" aria-hidden="true"/>Frais de livraison estimés : <strong>{fmt(calcDeliveryFee(false,+s1.distanceKm||0))}</strong></p>}</div>}
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-notes" className="text-xs tracking-widest uppercase text-muted-foreground">Demandes particulières</label><textarea id="o-notes" rows={2} value={s1.notes} onChange={e=>setS1(f=>({...f,notes:e.target.value}))} className={ic+" resize-none"} placeholder="Allergie, accès livraison..."/></div>
          </div>
          <div className="flex justify-end pt-2"><button onClick={()=>{ if(!s1.firstName||!s1.lastName||!s1.email||!s1.phone||!s1.eventDate||!s1.address||tooFar)return; setStep(2); }} disabled={tooFar} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">Étape suivante <CR size={14} aria-hidden="true"/></button></div>
        </div>
      )}
      {step===2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Votre menu &amp; nombre de personnes</h2>
          <div className="bg-card border border-border p-5 flex gap-4"><img src={(menu.images?.[0] || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format')} alt="" className="w-20 h-20 object-cover flex-shrink-0 bg-muted" aria-hidden="true"/><div><p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Menu sélectionné</p><h3 className="font-semibold text-lg" style={{fontFamily:"'Playfair Display',serif"}}>{menu.title}</h3><p className="text-sm text-muted-foreground mt-1">{fmt(menu.price)} pour {(menu.minPeople || menu.min_people || 4)} personnes</p></div></div>
          <div className="flex flex-col gap-2"><label className="text-xs tracking-widest uppercase text-muted-foreground" id="people-label">Nombre de personnes *</label><div className="flex items-center gap-4" role="group" aria-labelledby="people-label"><button type="button" onClick={()=>setPeople(p=>Math.max((menu.minPeople || menu.min_people || 4),p-1))} aria-label="Retirer une personne" className="w-10 h-10 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={16} aria-hidden="true"/></button><span className="text-3xl font-semibold w-12 text-center" aria-live="polite" aria-atomic="true" style={{fontFamily:"'Playfair Display',serif"}}>{people}</span><button type="button" onClick={()=>setPeople(p=>p+1)} aria-label="Ajouter une personne" className="w-10 h-10 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={16} aria-hidden="true"/></button></div><p className="text-xs text-muted-foreground">Minimum : {(menu.minPeople || menu.min_people || 4)} personnes</p>{hasDiscount&&<p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5" role="status"><CircleCheck size={14} aria-hidden="true"/>Remise de 10 % appliquée !</p>}</div>
          <div className="bg-secondary border border-border p-5 space-y-2" aria-live="polite" aria-atomic="true">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Estimation en temps réel</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Menu × {people} personnes</span><span>{fmt(menuSub)}</span></div>
            {hasDiscount&&<div className="flex justify-between text-sm text-emerald-700"><span>Remise 10 %</span><span>−{fmt(discount)}</span></div>}
            {!s1.inBordeaux&&<div className="flex justify-between text-sm text-muted-foreground"><span>Livraison</span><span>{fmt(delivFee)}</span></div>}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border" style={{fontFamily:"'Playfair Display',serif"}}><span>Total estimé</span><span className="text-primary">{fmt(total)}</span></div>
          </div>
          <div className="flex justify-between pt-2"><button onClick={()=>setStep(1)} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary flex items-center gap-2"><ArrowLeft size={14} aria-hidden="true"/>Retour</button><button onClick={()=>setStep(3)} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center gap-2">Récapitulatif <CR size={14} aria-hidden="true"/></button></div>
        </div>
      )}
      {step===3 && (
        <form onSubmit={handleConfirm} className="space-y-6" noValidate>
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Récapitulatif &amp; confirmation</h2>
          <dl className="bg-card border border-border divide-y divide-border text-sm">
            {[["Client",`${s1.firstName} ${s1.lastName}`],["E-mail",s1.email],["Téléphone",s1.phone],["Menu",menu.title],["Date",`${s1.eventDate?fmtDate(s1.eventDate):"—"} à ${s1.deliveryTime}`],["Livraison",`${s1.address}, ${s1.city}`],["Personnes",String(people)]].map(([k,v])=><div key={k} className="px-5 py-3 flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <div className="bg-secondary border border-border p-5 space-y-2 text-sm">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Détail du prix</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix menu × {people} personnes</span><span>{fmt(menuSub)}</span></div>
            {hasDiscount&&<div className="flex justify-between text-emerald-700"><span>Remise 10 %</span><span>−{fmt(discount)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Frais de livraison</span><span>{s1.inBordeaux?"Inclus":fmt(delivFee)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border" style={{fontFamily:"'Playfair Display',serif"}}><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
          </div>
          <div className="border-2 border-primary bg-primary/5 p-4 flex gap-3" role="note"><Info size={15} className="text-primary flex-shrink-0 mt-0.5" aria-hidden="true"/><div><p className="text-sm font-semibold text-primary mb-1">Conditions du menu</p><p className="text-sm text-muted-foreground leading-relaxed">{menu.conditions}</p></div></div>
          <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 accent-primary flex-shrink-0"/><span className="text-sm text-muted-foreground leading-relaxed">J&apos;ai lu et j&apos;accepte les <strong className="text-foreground">conditions du menu</strong> ainsi que les <strong className="text-foreground">CGV</strong>.</span></label>
          <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(2)} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary flex items-center gap-2"><ArrowLeft size={14} aria-hidden="true"/>Retour</button><button type="submit" disabled={!agreed} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-2"><Check size={16} aria-hidden="true"/>Confirmer la commande</button></div>
        </form>
      )}
    </div>
  );
}