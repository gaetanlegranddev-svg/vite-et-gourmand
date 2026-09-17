import { useState } from "react";
import { User, Package, LogOut, Edit2, Check, X, AlertTriangle, Clock, ChevronRight as CR, ReceiptText, UserCircle, ClipboardList, Ban, ChevronDown, Pencil } from "lucide-react";import { StatusBadge } from "./Badges.tsx";
import { updateProfile } from "../services/authService.js";
import { cancelOrder } from "../services/orderService.js";
import { fmt, fmtDate, fmtTime, OrderStatus, STATUS_SEQUENCE, STATUS_LABELS } from "../utils/helpers.ts";
import OrderModifyModal from './OrderModifyModal.tsx';

type UserTab = "commandes" | "profil";

interface AuthUser { name: string; email: string; role: string; phone?: string; address?: string; }
interface Order { id: string; menuTitle: string; menuImage: string; eventDate: string; people: number; total: number; currentStatus: OrderStatus; statusHistory: any[]; review?: any; [key: string]: any; }

const USER_TIMELINE: OrderStatus[] = ["en attente","accepté","en préparation","en cours de livraison","livré","terminée"];

// ── User Space ─────────────────────────────────────────────────────────────────
// ── User Space ─────────────────────────────────────────────────────────────────

export default function UserSpaceView({ user, orders, setOrders }: { user:AuthUser; orders:Order[]; setOrders:React.Dispatch<React.SetStateAction<Order[]>> }) {
  const [tab,setTab]=useState<UserTab>("commandes");
  const [expanded,setExpanded]=useState<string|null>(null);
  const [reviewOrder,setReviewOrder]=useState<Order|null>(null);
  const [modifyOrder,setModifyOrder]=useState<Order|null>(null);
  const [profileSaved,setProfileSaved]=useState(false);
  const [statusFilter,setStatusFilter]=useState<OrderStatus|"">("");
  const [profileForm,setProfileForm]=useState({ firstName:user.name.split(" ")[0]||"",lastName:user.name.split(" ").slice(1).join(" ")||"",email:user.email,phone:user.phone||"",address:user.address||"",currentPw:"",newPw:"",confirmPw:"" });
  const ic="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
  const allMyOrders=orders.filter(o=>o.userEmail===user.email).sort((a,b)=>b.statusHistory[0].at.localeCompare(a.statusHistory[0].at));
  const myOrders=statusFilter?allMyOrders.filter(o=>o.currentStatus===statusFilter):allMyOrders;
  const usedStatuses=[...new Set(allMyOrders.map(o=>o.currentStatus))];

  function cancelOrder(id:string){setOrders(p=>p.map(o=>o.id!==id?o:{...o,currentStatus:"annulée",statusHistory:[...o.statusHistory,{status:"annulée",at:new Date().toISOString()}]}));}
  function saveModify(id:string,partial:Partial<Order>){setOrders(p=>p.map(o=>o.id!==id?o:{...o,...partial}));}
  function submitReview(id:string,rating:number,comment:string){setOrders(p=>p.map(o=>o.id!==id?o:{...o,review:{rating,comment,at:new Date().toISOString(),validated:undefined}}));setReviewOrder(null);}

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8"><p className="text-xs tracking-widest uppercase text-accent mb-1">Espace personnel</p><h1 className="text-3xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Bonjour, {user.name.split(" ")[0]} !</h1></div>
      <div className="flex border-b border-border mb-8 gap-6" role="tablist">
        {([["commandes","Mes commandes"],["profil","Mon profil"]] as [UserTab,string][]).map(([t,l])=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)} className={`pb-3 text-sm uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${tab===t?"border-primary text-foreground font-medium":"border-transparent text-muted-foreground hover:text-foreground"}`}>{t==="commandes"?<ClipboardList size={14} aria-hidden="true"/>:<UserCircle size={14} aria-hidden="true"/>}{l}</button>)}
      </div>
      {tab==="commandes" && (
        <div className="space-y-4">
          {allMyOrders.length>0&&(
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Filtrer :</span>
              {(["",  ...usedStatuses] as (OrderStatus|"")[]).map(s=>(
                <button key={s} onClick={()=>{ setStatusFilter(s); setExpanded(null); }}
                  className={`px-3 py-1 text-xs border transition-colors ${statusFilter===s?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}>
                  {s===""?"Toutes":STATUS_LABELS[s as OrderStatus]}
                </button>
              ))}
            </div>
          )}
          {myOrders.length===0?<div className="text-center py-20 text-muted-foreground"><ReceiptText size={40} className="mx-auto mb-4 opacity-30" aria-hidden="true"/><p>{allMyOrders.length===0?"Vous n’avez pas encore de commande.":"Aucune commande pour ce statut."}</p></div>
          :myOrders.map(order=>{
            const isExp=expanded===order.id;
            const canCancel=order.currentStatus==="en attente";
            const canModify=order.currentStatus==="en attente";
            const isAccepted=!["en attente","annulée"].includes(order.currentStatus);
            const isDone=order.currentStatus==="terminée";
            const hasEquip=order.hasEquipmentLoan&&order.currentStatus==="en attente du retour de matériel";
            const timeline=order.hasEquipmentLoan?["en attente","accepté","en préparation","en cours de livraison","livré","en attente du retour de matériel","terminée"] as OrderStatus[]:USER_TIMELINE;
            return (
              <div key={order.id} className="bg-card border border-border overflow-hidden">
                <button className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors" onClick={()=>setExpanded(isExp?null:order.id)} aria-expanded={isExp}>
                  <img src={order.menuImage} alt="" className="w-14 h-14 object-cover flex-shrink-0 bg-muted" aria-hidden="true"/>
                  <div className="flex-1 min-w-0"><p className="font-medium leading-snug" style={{fontFamily:"'Playfair Display',serif"}}>{order.menuTitle}</p><p className="text-xs text-muted-foreground mt-0.5">{order.eventDate?fmtDate(order.eventDate):"—"} — {order.people} personnes — {fmt(order.total)}</p><div className="mt-1.5"><StatusBadge status={order.currentStatus}/></div></div>
                  <ChevronDown size={16} className={`text-muted-foreground flex-shrink-0 transition-transform ${isExp?"rotate-180":""}`} aria-hidden="true"/>
                </button>
                {isExp&&(
                  <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
                    <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                      {[["Date",order.eventDate?fmtDate(order.eventDate):"—"],["Heure",order.deliveryTime],["Adresse",`${order.address}, ${order.city}`],["Personnes",String(order.people)],["Téléphone",order.phone]].map(([k,v])=><div key={k}><dt className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{k}</dt><dd className="font-medium">{v}</dd></div>)}
                    </dl>
                    <div className="bg-secondary p-4 text-sm space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Détail du prix</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Menu × {order.people}</span><span>{fmt(order.menuSubtotal)}</span></div>
                      {order.discount>0&&<div className="flex justify-between text-emerald-700"><span>Remise 10 %</span><span>−{fmt(order.discount)}</span></div>}
                      <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>{order.inBordeaux?"Incluse":fmt(order.deliveryFee)}</span></div>
                      <div className="flex justify-between font-semibold pt-1.5 border-t border-border" style={{fontFamily:"'Playfair Display',serif"}}><span>Total</span><span className="text-primary">{fmt(order.total)}</span></div>
                    </div>
                    {order.currentStatus==="annulée"&&order.cancellationReason&&<div className="bg-red-50 border border-red-200 p-4 text-sm" role="note"><p className="font-semibold text-red-700 mb-1">Motif d&apos;annulation</p><p className="text-red-700">Contact effectué par : {order.cancellationContactMode}</p><p className="text-red-600 mt-1">{order.cancellationReason}</p></div>}
                    {hasEquip&&<div className="bg-rose-50 border-2 border-rose-300 p-4 text-sm space-y-1.5" role="alert"><p className="font-semibold text-rose-700 flex items-center gap-2"><Box size={14} aria-hidden="true"/>Retour de matériel requis</p><p className="text-rose-700">Du matériel vous a été prêté. Veuillez le restituer sous <strong>10 jours ouvrés</strong> en contactant Vite &amp; Gourmand, faute de quoi des frais de <strong>600 € TTC</strong> seront facturés.</p></div>}
                    {isAccepted&&(<div><p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Suivi de commande</p><ol className="space-y-3">{timeline.map((st,i)=>{ const entry=order.statusHistory.find(e=>e.status===st); const isCurrent=order.currentStatus===st; const isPast=!!entry; return <li key={i} className="flex items-start gap-3"><div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${isCurrent?"bg-primary":isPast?"bg-accent":"bg-border"}`} aria-hidden="true"/><div className={isPast?"":"opacity-30"}><p className={`text-sm font-medium ${isCurrent?"text-foreground":"text-muted-foreground"}`} aria-current={isCurrent?"step":undefined}>{STATUS_LABELS[st]}</p>{entry&&<p className="text-xs text-muted-foreground">{fmtDate(entry.at)} à {fmtTime(entry.at)}</p>}</div></li>; })}</ol></div>)}
                    {isDone&&(order.review?(<div className="bg-secondary border border-border p-4"><p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Votre avis</p><StarRating value={order.review.rating}/><p className="text-sm mt-2">{order.review.comment}</p>{order.review.validated===undefined&&<p className="text-xs text-amber-600 mt-1 flex items-center gap-1" role="status"><Clock size={11} aria-hidden="true"/>En attente de validation.</p>}{order.review.validated===true&&<p className="text-xs text-emerald-600 mt-1" role="status">Avis publié sur notre page d&apos;accueil.</p>}{order.review.validated===false&&<p className="text-xs text-red-600 mt-1" role="status">Avis non publié.</p>}</div>):(<div className="bg-secondary border border-border p-4 flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Votre expérience compte !</p><p className="text-xs text-muted-foreground mt-0.5">Partagez votre avis — il sera visible après validation.</p></div><button onClick={()=>setReviewOrder(order)} className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-foreground text-xs flex-shrink-0 hover:opacity-90"><Star size={12} aria-hidden="true"/>Donner mon avis</button></div>))}
                    {(canCancel||canModify)&&<div className="flex gap-3 pt-1">{canModify&&<button onClick={()=>setModifyOrder(order)} className="flex items-center gap-1.5 px-4 py-2 border border-border text-sm hover:bg-secondary"><Pencil size={13} aria-hidden="true"/>Modifier</button>}{canCancel&&<button onClick={()=>{ if(confirm("Annuler cette commande ?")) cancelOrder(order.id); }} className="flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 text-sm hover:bg-red-50"><Ban size={13} aria-hidden="true"/>Annuler la commande</button>}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab==="profil"&&(
        <div className="max-w-lg space-y-5">
          {profileSaved&&<div role="status" className="bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2"><CircleCheck size={14} aria-hidden="true"/>Informations mises à jour.</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-fn" className="text-xs tracking-widest uppercase text-muted-foreground">Prénom</label><input id="pf-fn" value={profileForm.firstName} onChange={e=>setProfileForm(f=>({...f,firstName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-ln" className="text-xs tracking-widest uppercase text-muted-foreground">Nom</label><input id="pf-ln" value={profileForm.lastName} onChange={e=>setProfileForm(f=>({...f,lastName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail</label><input id="pf-email" type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-phone" className="text-xs tracking-widest uppercase text-muted-foreground">Téléphone</label><input id="pf-phone" type="tel" value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="pf-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse postale</label><input id="pf-addr" value={profileForm.address} onChange={e=>setProfileForm(f=>({...f,address:e.target.value}))} className={ic}/></div>
          </div>
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-xs tracking-widest uppercase text-muted-foreground">Changer le mot de passe</p>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-cpw" className="text-xs text-muted-foreground">Mot de passe actuel</label><input id="pf-cpw" type="password" value={profileForm.currentPw} onChange={e=>setProfileForm(f=>({...f,currentPw:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-npw" className="text-xs text-muted-foreground">Nouveau mot de passe</label><input id="pf-npw" type="password" value={profileForm.newPw} onChange={e=>setProfileForm(f=>({...f,newPw:e.target.value}))} className={ic}/>{profileForm.newPw&&<PasswordStrengthBar pw={profileForm.newPw}/>}</div>
            <div className="flex flex-col gap-1.5"><label htmlFor="pf-conf" className="text-xs text-muted-foreground">Confirmer</label><input id="pf-conf" type="password" value={profileForm.confirmPw} onChange={e=>setProfileForm(f=>({...f,confirmPw:e.target.value}))} className={ic}/></div>
          </div>
          <button onClick={()=>setProfileSaved(true)} className="px-6 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Enregistrer</button>
        </div>
      )}
      {reviewOrder&&<ReviewModal order={reviewOrder} onClose={()=>setReviewOrder(null)} onSubmit={(r,c)=>submitReview(reviewOrder.id,r,c)}/>}
      {modifyOrder&&<OrderModifyModal order={modifyOrder} onClose={()=>setModifyOrder(null)} onSave={p=>saveModify(modifyOrder.id,p)}/>}
    </div>
  );
}
