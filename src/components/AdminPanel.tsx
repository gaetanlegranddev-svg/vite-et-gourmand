// ============================================
// Vite & Gourmand — Admin Panel Component
// ============================================
import { useState, useMemo } from "react";
import { 
  Edit2, Trash2, Plus, X, Check, AlertTriangle, Search, Filter,
  ThumbsUp, ThumbsDown, Package, Settings, Users, BarChart2,
  TrendingUp, ShieldOff, ShieldCheck, RefreshCw, Box, MessageSquare,
  CalendarDays, Clock, Ban, Truck, Info, ChevronRight as CR
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ThemeBadge, RegimeBadge, StockIndicator, StatusBadge, StarRating } from "./Badges.tsx";
import { updateOrderStatus, getAllOrders } from "../services/orderService.js";
import StatsTab from './StatsTab.tsx';
import CancelOrderModal from './CancelOrderModal.tsx';
import AdvanceStatusModal from './AdvanceStatusModal.tsx';
import TeamTab from './TeamTab.tsx';

const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"2-digit" });

type AdminTab = "commandes" | "menus" | "plats" | "horaires" | "avis" | "equipe" | "statistiques";
type OrderStatus = "en attente" | "accepté" | "en préparation" | "en cours de livraison" | "livré" | "en attente du retour de matériel" | "terminée" | "annulée";

const STATUS_SEQUENCE: OrderStatus[] = ["en attente","accepté","en préparation","en cours de livraison","livré","en attente du retour de matériel","terminée"];
const STATUS_LABELS: Record<OrderStatus,string> = {
  "en attente":"En attente","accepté":"Accepté","en préparation":"En préparation",
  "en cours de livraison":"En cours de livraison","livré":"Livré",
  "en attente du retour de matériel":"En attente du retour de matériel",
  "terminée":"Terminée","annulée":"Annulée",
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
const CHART_COLORS = ["#7A1C1C","#B8832A","#4A7C59","#3B6FA0","#8B5E3C","#5B3A7E"];

// ── Admin Panel ────────────────────────────────────────────────────────────────

const EMENU: Omit<MenuData,"id"> = { title:"", images:[], description:"", theme:"classique", dishIds:[], minPeople:4, price:0, conditions:"", regime:"classique", stock:10, active:true, minOrderDays:5, storage:"" };
const EDISH: Omit<Dish,"id"> = { name:"", type:"entrée", allergens:[] };

export default function AdminPanel({ menus, dishes, orders, hours, user, setMenus, setDishes, setOrders, setHours }: {
  menus:MenuData[]; dishes:Dish[]; orders:Order[]; hours:HourSlot[]; user:AuthUser;
  setMenus:React.Dispatch<React.SetStateAction<MenuData[]>>;
  setDishes:React.Dispatch<React.SetStateAction<Dish[]>>;
  setOrders:React.Dispatch<React.SetStateAction<Order[]>>;
  setHours:React.Dispatch<React.SetStateAction<HourSlot[]>>;
}) {
  const [tab,setTab]=useState<AdminTab>("commandes");
  const [em,setEm]=useState<MenuData|null>(null); const [nm,setNm]=useState(false); const [mf,setMf]=useState<Omit<MenuData,"id">>(EMENU); const [imgIn,setImgIn]=useState("");
  const [ed,setEd]=useState<Dish|null>(null); const [nd,setNd]=useState(false); const [df,setDf]=useState<Omit<Dish,"id">>(EDISH);
  const [cancelTarget,setCancelTarget]=useState<Order|null>(null);
  const [advanceTarget,setAdvanceTarget]=useState<Order|null>(null);
  const [oSearch,setOSearch]=useState("");
  const [oStatus,setOStatus]=useState<OrderStatus|"all">("all");
  const isAdmin=user.role==="admin";
  const ic="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  const filteredOrders=useMemo(()=>orders.filter(o=>{ const q=oSearch.toLowerCase(); return (!q||`${o.firstName} ${o.lastName} ${o.email}`.toLowerCase().includes(q))&&(oStatus==="all"||o.currentStatus===oStatus); }),[orders,oSearch,oStatus]);

  function smenu(){ if(!mf.title.trim())return; if(nm)setMenus(p=>[...p,{...mf,id:uid()}]); else if(em)setMenus(p=>p.map(m=>m.id===em.id?{...mf,id:m.id}:m)); setNm(false); setEm(null); }
  function sdish(){ if(!df.name.trim())return; if(nd)setDishes(p=>[...p,{...df,id:uid()}]); else if(ed)setDishes(p=>p.map(d=>d.id===ed.id?{...df,id:d.id}:d)); setNd(false); setEd(null); }
  function handleAdvance(order:Order,next:OrderStatus,hasEquip?:boolean){ setOrders(p=>p.map(o=>o.id!==order.id?o:{...o,currentStatus:next,hasEquipmentLoan:hasEquip??o.hasEquipmentLoan,statusHistory:[...o.statusHistory,{status:next,at:new Date().toISOString()}]})); setAdvanceTarget(null); }
  function handleCancel(order:Order,cm:string,reason:string){ setOrders(p=>p.map(o=>o.id!==order.id?o:{...o,currentStatus:"annulée",cancellationContactMode:cm,cancellationReason:reason,statusHistory:[...o.statusHistory,{status:"annulée",at:new Date().toISOString()}]})); setCancelTarget(null); }
  function handleReview(orderId:string,validated:boolean){ setOrders(p=>p.map(o=>o.id!==orderId||!o.review?o:{...o,review:{...o.review!,validated}})); }

  const pendingReviews=orders.filter(o=>o.review&&o.review.validated===undefined).length;
  const tabDef: [AdminTab,string][] = [
    ["commandes",`Commandes (${orders.length})`],["menus",`Menus (${menus.length})`],["plats",`Plats (${dishes.length})`],
    ["horaires","Horaires"],["avis",`Avis${pendingReviews>0?` (${pendingReviews})`:""}`],
    ...(isAdmin ? [["equipe","Équipe"],["statistiques","Statistiques"]] as [AdminTab,string][] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div><p className="text-xs tracking-widest uppercase text-accent mb-1">{isAdmin?"Administration":"Espace Employé"}</p><h1 className="text-3xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Bonjour, {user.name.split(" ")[0]}</h1></div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Settings size={14} aria-hidden="true"/><span className="capitalize">{user.role}</span></div>
      </div>
      <div className="flex border-b border-border mb-8 gap-4 overflow-x-auto" role="tablist" aria-label="Sections de l'espace administration">
        {tabDef.map(([t,l])=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>{ setTab(t); setNm(false); setEm(null); setNd(false); setEd(null); }} className={`pb-3 text-sm uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${tab===t?"border-primary text-foreground font-medium":"border-transparent text-muted-foreground hover:text-foreground"}`}>{l}{t==="avis"&&pendingReviews>0&&<span className="ml-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] inline-flex items-center justify-center" aria-label={`${pendingReviews} en attente`}>{pendingReviews}</span>}</button>)}
      </div>

      {/* COMMANDES */}
      {tab==="commandes"&&(
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><label htmlFor="ord-search" className="sr-only">Rechercher un client</label><input id="ord-search" value={oSearch} onChange={e=>setOSearch(e.target.value)} placeholder="Rechercher un client (nom, e-mail)..." className="w-full bg-input-background border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"/></div>
            <div className="flex items-center gap-2"><Filter size={14} className="text-muted-foreground flex-shrink-0" aria-hidden="true"/><label htmlFor="ord-status" className="sr-only">Filtrer par statut</label><select id="ord-status" value={oStatus} onChange={e=>setOStatus(e.target.value as OrderStatus|"all")} className="bg-input-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"><option value="all">Tous les statuts</option>{[...STATUS_SEQUENCE,"annulée" as OrderStatus].map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            {(oSearch||oStatus!=="all")&&<button onClick={()=>{ setOSearch(""); setOStatus("all"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground flex-shrink-0"><RefreshCw size={13} aria-hidden="true"/>Réinitialiser</button>}
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">{filteredOrders.length} commande{filteredOrders.length>1?"s":""} affichée{filteredOrders.length>1?"s":""}</p>
          {filteredOrders.length===0?<div className="text-center py-16 text-muted-foreground"><Package size={36} className="mx-auto mb-3 opacity-30" aria-hidden="true"/><p>Aucune commande ne correspond aux filtres.</p></div>
          :filteredOrders.sort((a,b)=>b.statusHistory[0].at.localeCompare(a.statusHistory[0].at)).map(order=>{
            const canAdvance=!["annulée","terminée"].includes(order.currentStatus);
            return (
              <div key={order.id} className="bg-card border border-border p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <img src={order.menuImage} alt="" className="w-12 h-12 object-cover bg-muted flex-shrink-0" aria-hidden="true"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{fontFamily:"'Playfair Display',serif"}}>{order.menuTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.firstName} {order.lastName} — {order.email} — {order.phone}</p>
                    <p className="text-xs text-muted-foreground">{order.eventDate?fmtDateShort(order.eventDate):"—"} à {order.deliveryTime} — {order.people} pers. — {fmt(order.total)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2 items-center"><StatusBadge status={order.currentStatus}/>{order.hasEquipmentLoan&&<span className="text-[10px] px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 flex items-center gap-1"><Box size={9} aria-hidden="true"/>Prêt matériel</span>}</div>
                    {order.currentStatus==="annulée"&&order.cancellationReason&&<p className="text-xs text-muted-foreground mt-1 italic">Annulé par {order.cancellationContactMode} : {order.cancellationReason.slice(0,80)}{order.cancellationReason.length>80?"…":""}</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {canAdvance&&<button onClick={()=>setAdvanceTarget(order)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs hover:opacity-90 whitespace-nowrap"><CR size={12} aria-hidden="true"/>Avancer le statut</button>}
                    {order.currentStatus==="en attente"&&<button onClick={()=>setCancelTarget(order)} className="flex items-center gap-1.5 px-3 py-2 border border-red-300 text-red-600 text-xs hover:bg-red-50 whitespace-nowrap"><Ban size={12} aria-hidden="true"/>Annuler</button>}
                  </div>
                </div>
                {order.notes&&<div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground"><strong className="text-foreground">Notes client : </strong>{order.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* MENUS */}
      {tab==="menus"&&!(nm||em)&&(<><div className="flex justify-end mb-5"><button onClick={()=>{ setMf(EMENU); setImgIn(""); setNm(true); setEm(null); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm hover:opacity-90"><Plus size={14} aria-hidden="true"/>Nouveau menu</button></div>
        <div className="border border-border overflow-x-auto"><table className="w-full text-sm min-w-[580px]"><caption className="sr-only">Liste des menus</caption><thead className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="text-left px-4 py-3" scope="col">Titre</th><th className="text-left px-4 py-3" scope="col">Thème</th><th className="text-left px-4 py-3" scope="col">Prix</th><th className="text-left px-4 py-3" scope="col">Stock</th><th className="text-left px-4 py-3" scope="col">Statut</th><th className="px-4 py-3" scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-border">{menus.map(m=><tr key={m.id} className="hover:bg-secondary/50"><td className="px-4 py-3 font-medium max-w-[180px] truncate">{m.title}</td><td className="px-4 py-3"><ThemeBadge theme={m.theme}/></td><td className="px-4 py-3 text-primary font-medium">{fmt(m.price)}</td><td className="px-4 py-3"><StockIndicator stock={m.stock}/></td><td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 ${m.active?"bg-emerald-100 text-emerald-700":"bg-muted text-muted-foreground"}`}>{m.active?"Actif":"Masqué"}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2 justify-end"><button onClick={()=>{ setMf({...m}); setImgIn(""); setEm(m); setNm(false); }} aria-label={`Modifier ${m.title}`} className="text-muted-foreground hover:text-foreground"><Edit2 size={14} aria-hidden="true"/></button>{isAdmin&&<button onClick={()=>setMenus(p=>p.filter(x=>x.id!==m.id))} aria-label={`Supprimer ${m.title}`} className="text-muted-foreground hover:text-red-600"><Trash2 size={14} aria-hidden="true"/></button>}</div></td></tr>)}</tbody></table></div></>)}
      {tab==="menus"&&(nm||em)&&(
        <div className="bg-card border border-border p-6 space-y-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>{nm?"Nouveau menu":"Modifier"}</h2><button onClick={()=>{ setNm(false); setEm(null); }} aria-label="Fermer le formulaire"><X size={18} aria-hidden="true"/></button></div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-1.5"><label htmlFor="mf-title" className="text-xs tracking-widest uppercase text-muted-foreground">Titre *</label><input id="mf-title" value={mf.title} onChange={e=>setMf(f=>({...f,title:e.target.value}))} className={ic}/></div>
            <div className="md:col-span-2 flex flex-col gap-1.5"><label htmlFor="mf-desc" className="text-xs tracking-widest uppercase text-muted-foreground">Description</label><textarea id="mf-desc" rows={3} value={mf.description} onChange={e=>setMf(f=>({...f,description:e.target.value}))} className={ic+" resize-none"}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-theme" className="text-xs tracking-widest uppercase text-muted-foreground">Thème</label><select id="mf-theme" value={mf.theme} onChange={e=>setMf(f=>({...f,theme:e.target.value as Theme}))} className={ic}>{THEMES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-regime" className="text-xs tracking-widest uppercase text-muted-foreground">Régime</label><select id="mf-regime" value={mf.regime} onChange={e=>setMf(f=>({...f,regime:e.target.value as Regime}))} className={ic}>{REGIMES.map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-minp" className="text-xs tracking-widest uppercase text-muted-foreground">Personnes min.</label><input id="mf-minp" type="number" min={1} value={mf.minPeople} onChange={e=>setMf(f=>({...f,minPeople:+e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-price" className="text-xs tracking-widest uppercase text-muted-foreground">Prix (€)</label><input id="mf-price" type="number" min={0} step={0.01} value={mf.price} onChange={e=>setMf(f=>({...f,price:+e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-stock" className="text-xs tracking-widest uppercase text-muted-foreground">Stock</label><input id="mf-stock" type="number" min={0} value={mf.stock} onChange={e=>setMf(f=>({...f,stock:+e.target.value}))} className={ic}/></div>
            <div className="flex items-center gap-3 self-end pb-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={mf.active} onChange={e=>setMf(f=>({...f,active:e.target.checked}))} className="accent-primary"/><span className="text-sm">{mf.active?"Actif":"Masqué"}</span></label></div>
            <div className="md:col-span-2 flex flex-col gap-1.5"><label htmlFor="mf-cond" className="text-xs tracking-widest uppercase text-muted-foreground">Conditions</label><textarea id="mf-cond" rows={2} value={mf.conditions} onChange={e=>setMf(f=>({...f,conditions:e.target.value}))} className={ic+" resize-none"}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mf-mindays" className="text-xs tracking-widest uppercase text-muted-foreground">Délai min. commande (jours)</label><input id="mf-mindays" type="number" min={1} value={mf.minOrderDays} onChange={e=>setMf(f=>({...f,minOrderDays:+e.target.value}))} className={ic}/></div>
            <div className="md:col-span-2 flex flex-col gap-1.5"><label htmlFor="mf-storage" className="text-xs tracking-widest uppercase text-muted-foreground">Précautions de stockage</label><textarea id="mf-storage" rows={2} value={mf.storage} onChange={e=>setMf(f=>({...f,storage:e.target.value}))} className={ic+" resize-none"} placeholder="Conserver entre 0 °C et 4 °C…"/></div>
            <div className="md:col-span-2 flex flex-col gap-2"><label className="text-xs tracking-widest uppercase text-muted-foreground">Galerie (URLs)</label><div className="flex gap-2"><input value={imgIn} onChange={e=>setImgIn(e.target.value)} className={ic+" flex-1"} placeholder="https://…" aria-label="URL de l'image à ajouter"/><button type="button" onClick={()=>{ if(imgIn.trim()){ setMf(f=>({...f,images:[...f.images,imgIn.trim()]})); setImgIn(""); }}} aria-label="Ajouter l'image" className="px-3 border border-border hover:bg-secondary"><Plus size={14} aria-hidden="true"/></button></div>{mf.images.length>0&&<div className="flex gap-2 flex-wrap">{mf.images.map((img,i)=><div key={i} className="relative w-20 h-16 bg-muted"><img src={img} alt={`Image ${i+1} du menu`} className="w-full h-full object-cover"/><button onClick={()=>setMf(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))} aria-label={`Supprimer l'image ${i+1}`} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white flex items-center justify-center"><X size={10} aria-hidden="true"/></button></div>)}</div>}</div>
            <fieldset className="md:col-span-2 flex flex-col gap-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Plats</legend><div className="grid sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-border p-3 bg-input-background">{(["entrée","plat","dessert"] as DishType[]).map(type=><div key={type}><p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{type}s</p>{dishes.filter(d=>d.type===type).map(d=><label key={d.id} className="flex items-center gap-2 text-xs mb-1 cursor-pointer"><input type="checkbox" checked={mf.dishIds.includes(d.id)} onChange={e=>setMf(f=>({...f,dishIds:e.target.checked?[...f.dishIds,d.id]:f.dishIds.filter(id=>id!==d.id)}))} className="accent-primary"/>{d.name}</label>)}</div>)}</div></fieldset>
          </div>
          <div className="flex gap-3 pt-2"><button onClick={smenu} className="px-6 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Enregistrer</button><button onClick={()=>{ setNm(false); setEm(null); }} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button></div>
        </div>
      )}

      {/* PLATS */}
      {tab==="plats"&&!(nd||ed)&&(<><div className="flex justify-end mb-5"><button onClick={()=>{ setDf(EDISH); setNd(true); setEd(null); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm hover:opacity-90"><Plus size={14} aria-hidden="true"/>Nouveau plat</button></div>
        <div className="border border-border overflow-x-auto"><table className="w-full text-sm min-w-[480px]"><caption className="sr-only">Liste des plats</caption><thead className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="text-left px-4 py-3" scope="col">Nom</th><th className="text-left px-4 py-3" scope="col">Type</th><th className="text-left px-4 py-3" scope="col">Allergènes</th><th className="text-left px-4 py-3" scope="col">Menus</th><th className="px-4 py-3" scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-border">{dishes.map(d=><tr key={d.id} className="hover:bg-secondary/50"><td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3 capitalize text-muted-foreground">{d.type}</td><td className="px-4 py-3 text-xs text-muted-foreground">{d.allergens.length?d.allergens.join(", "):"—"}</td><td className="px-4 py-3 text-xs text-muted-foreground">{menus.filter(m=>(m.dishIds || []).includes(d.id)).length} menu{menus.filter(m=>(m.dishIds || []).includes(d.id)).length>1?"s":""}</td><td className="px-4 py-3"><div className="flex items-center gap-2 justify-end"><button onClick={()=>{ setDf({...d}); setEd(d); setNd(false); }} aria-label={`Modifier ${d.name}`} className="text-muted-foreground hover:text-foreground"><Edit2 size={14} aria-hidden="true"/></button>{isAdmin&&<button onClick={()=>setDishes(p=>p.filter(x=>x.id!==d.id))} aria-label={`Supprimer ${d.name}`} className="text-muted-foreground hover:text-red-600"><Trash2 size={14} aria-hidden="true"/></button>}</div></td></tr>)}</tbody></table></div></>)}
      {tab==="plats"&&(nd||ed)&&(
        <div className="bg-card border border-border p-6 space-y-5 max-w-lg">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>{nd?"Nouveau plat":"Modifier"}</h2><button onClick={()=>{ setNd(false); setEd(null); }} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="df-name" className="text-xs tracking-widest uppercase text-muted-foreground">Nom *</label><input id="df-name" value={df.name} onChange={e=>setDf(f=>({...f,name:e.target.value}))} className={ic}/></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="df-type" className="text-xs tracking-widests uppercase text-muted-foreground">Type</label><select id="df-type" value={df.type} onChange={e=>setDf(f=>({...f,type:e.target.value as DishType}))} className={ic}><option value="entrée">Entrée</option><option value="plat">Plat</option><option value="dessert">Dessert</option></select></div>
          <fieldset className="flex flex-col gap-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Allergènes (14 UE)</legend><div className="grid grid-cols-2 gap-1.5 bg-input-background border border-border p-3">{ALLERGENS.map(a=><label key={a} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={df.allergens.includes(a)} onChange={e=>setDf(f=>({...f,allergens:e.target.checked?[...f.allergens,a]:f.allergens.filter(x=>x!==a)}))} className="accent-primary"/>{a}</label>)}</div></fieldset>
          <div className="flex gap-3"><button onClick={sdish} className="px-6 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Enregistrer</button><button onClick={()=>{ setNd(false); setEd(null); }} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button></div>
        </div>
      )}

      {/* HORAIRES */}
      {tab==="horaires"&&(
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-muted-foreground">Modifiez les horaires d&apos;ouverture affichés sur le site.</p>
          <div className="bg-card border border-border divide-y divide-border" role="list" aria-label="Horaires par jour">
            {hours.map((h,i)=>(
              <div key={h.day} className="flex items-center gap-4 px-4 py-3" role="listitem">
                <span className="w-24 text-sm font-medium flex-shrink-0">{h.day}</span>
                <label htmlFor={`hour-${i}`} className="sr-only">Horaires du {h.day}</label>
                <input id={`hour-${i}`} value={h.time} onChange={e=>setHours(prev=>prev.map((x,j)=>j===i?{...x,time:e.target.value}:x))} className="flex-1 bg-input-background border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"/>
              </div>
            ))}
          </div>
          <button onClick={()=>setHours(HOURS_INIT)} className="flex items-center gap-1.5 px-4 py-2 border border-border text-sm hover:bg-secondary"><RefreshCw size={13} aria-hidden="true"/>Réinitialiser les horaires par défaut</button>
        </div>
      )}

      {/* AVIS */}
      {tab==="avis"&&(
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Validez ou refusez les avis clients avant leur publication sur la page d&apos;accueil.</p>
          {orders.filter(o=>o.review).length===0?<div className="text-center py-16 text-muted-foreground"><MessageSquare size={36} className="mx-auto mb-3 opacity-30" aria-hidden="true"/><p>Aucun avis reçu.</p></div>
          :orders.filter(o=>o.review).sort((a,b)=>(b.review!.at||"").localeCompare(a.review!.at||"")).map(order=>(
            <div key={order.id} className="bg-card border border-border p-5">
              <div className="flex items-start gap-4 flex-wrap">
                <img src={order.menuImage} alt="" className="w-12 h-12 object-cover bg-muted flex-shrink-0" aria-hidden="true"/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{fontFamily:"'Playfair Display',serif"}}>{order.firstName} {order.lastName}</p>
                  <p className="text-xs text-muted-foreground">Menu : {order.menuTitle} — {fmtDate(order.eventDate)}</p>
                  <div className="mt-2"><StarRating value={order.review!.rating} label={`Note : ${order.review!.rating} étoile${order.review!.rating>1?"s":""}`}/></div>
                  <p className="text-sm mt-2 leading-relaxed">{order.review!.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">Soumis le {fmtDate(order.review!.at)}</p>
                  <div className="mt-2" aria-live="polite">
                    {order.review!.validated===undefined&&<span className="text-xs px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-700">En attente de validation</span>}
                    {order.review!.validated===true&&<span className="text-xs px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-700">Publié sur le site</span>}
                    {order.review!.validated===false&&<span className="text-xs px-2 py-0.5 bg-red-100 border border-red-200 text-red-600">Refusé</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={()=>handleReview(order.id,true)} aria-label={`Valider l'avis de ${order.firstName} ${order.lastName}`} aria-pressed={order.review!.validated===true} className={`flex items-center gap-1.5 px-3 py-2 text-xs border transition-colors ${order.review!.validated===true?"bg-emerald-600 text-white border-emerald-600":"border-emerald-400 text-emerald-700 hover:bg-emerald-50"}`}><ThumbsUp size={13} aria-hidden="true"/>{order.review!.validated===true?"Publié":"Valider"}</button>
                  <button onClick={()=>handleReview(order.id,false)} aria-label={`Refuser l'avis de ${order.firstName} ${order.lastName}`} aria-pressed={order.review!.validated===false} className={`flex items-center gap-1.5 px-3 py-2 text-xs border transition-colors ${order.review!.validated===false?"bg-red-600 text-white border-red-600":"border-red-300 text-red-600 hover:bg-red-50"}`}><ThumbsDown size={13} aria-hidden="true"/>{order.review!.validated===false?"Refusé":"Refuser"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="equipe"&&isAdmin&&<TeamTab/>}
      {tab==="statistiques"&&isAdmin&&<StatsTab menus={menus} orders={orders}/>}

      {cancelTarget&&<CancelOrderModal order={cancelTarget} onClose={()=>setCancelTarget(null)} onConfirm={(cm,r)=>handleCancel(cancelTarget,cm,r)}/>}
      {advanceTarget&&<AdvanceStatusModal order={advanceTarget} onClose={()=>setAdvanceTarget(null)} onConfirm={(next,hasEq)=>handleAdvance(advanceTarget,next,hasEq)}/>}
    </div>
  );
}
