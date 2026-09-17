// ============================================
// Vite & Gourmand — Menu Detail View Component
// ============================================
import { useState } from "react";
import { AlertTriangle, Info, ShoppingCart, Lock, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { ThemeBadge, RegimeBadge, StockIndicator } from "./Badges.tsx";
import ImageGallery from "./ImageGallery.tsx";

type DishType = "entrée" | "plat" | "dessert";
interface Dish { id: string; name: string; type: DishType; allergens: string[] }
interface MenuData {
  id: string; title: string; images: string[]; description: string;
  theme: string; dishIds: string[]; minPeople: number; min_people: number;
  price: number; conditions: string; regime: string; stock: number;
  active: boolean; minOrderDays: number; storage: string;
}
interface AuthUser { name: string; email: string; role: string; }

const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" });

export default function MenuDetailView({ menu, dishes, user, onBack, onOrder, onAuth }: { menu:MenuData; dishes:Dish[]; user:AuthUser|null; onBack:()=>void; onOrder:()=>void; onAuth:()=>void }) {
  const md=dishes.filter(d=>(menu.dishIds || []).includes(d.id));
  const byType=(t:DishType)=>md.filter(d=>d.type===t);
  const allergens=[...new Set(md.flatMap(d=>d.allergens))];
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft size={14} aria-hidden="true"/>Retour aux menus</button>
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-start">
        <div className="space-y-4">
          <ImageGallery images={menu.images} title={menu.title}/>
          <div className="flex gap-2 flex-wrap"><ThemeBadge theme={menu.theme}/><RegimeBadge regime={menu.regime}/><StockIndicator stock={menu.stock}/></div>
          {allergens.length>0 && <div className="bg-amber-50 border border-amber-200 p-4" role="region" aria-label="Information allergènes"><p className="text-xs font-semibold uppercase tracking-widest text-amber-700 flex items-center gap-1.5 mb-2"><AlertTriangle size={13} aria-hidden="true"/>Allergènes présents dans ce menu</p><div className="flex flex-wrap gap-1.5">{allergens.map(a=><span key={a} className="text-[11px] px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800">{a}</span>)}</div><p className="text-[11px] text-amber-700 mt-2">En cas d&apos;allergie grave, signalez-le impérativement lors de la commande.</p></div>}
          {menu.storage && <div className="bg-blue-50 border border-blue-200 p-4" role="region" aria-label="Précautions de stockage"><p className="text-xs font-semibold uppercase tracking-widest text-blue-700 flex items-center gap-1.5 mb-2"><Info size={13} aria-hidden="true"/>Précautions de stockage</p><p className="text-sm text-blue-800 leading-relaxed">{menu.storage}</p></div>}
        </div>
        <div className="space-y-6">
          <div><h1 className="text-3xl md:text-4xl font-semibold leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>{menu.title}</h1><p className="text-muted-foreground mt-3 leading-relaxed">{menu.description}</p></div>
          <div className="grid grid-cols-2 gap-4 py-5 border-y border-border">
            <div><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Prix</p><p className="text-3xl font-semibold text-primary" style={{fontFamily:"'Playfair Display',serif"}}>{fmt(menu.price)}</p><p className="text-xs text-muted-foreground">pour {(menu.minPeople || menu.min_people || 4)} personnes</p></div>
            <div><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Minimum</p><p className="text-3xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>{(menu.minPeople || menu.min_people || 4)}</p><p className="text-xs text-muted-foreground">personnes</p></div>
          </div>
          {(["entrée","plat","dessert"] as DishType[]).map(type=>{ const items=byType(type); if(!items.length) return null; return <section key={type} aria-label={`${type}s`}><p className="text-xs tracking-widest uppercase text-muted-foreground pb-2 border-b border-border mb-3">{type.charAt(0).toUpperCase()+type.slice(1)}{items.length>1?"s":""}</p><ul className="space-y-3">{items.map(d=><li key={d.id}><p className="font-medium text-sm" style={{fontFamily:"'Playfair Display',serif"}}>{d.name}</p>{d.allergens.length>0 && <div className="flex items-center gap-1.5 mt-1 flex-wrap"><AlertTriangle size={10} className="text-amber-500 flex-shrink-0" aria-hidden="true"/><span className="sr-only">Allergènes : </span>{d.allergens.map(a=><span key={a} className="text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800">{a}</span>)}</div>}</li>)}</ul></section>; })}
          <div className="border-2 border-primary bg-primary/5 p-5 space-y-2" role="note" aria-label="Conditions importantes">
            <p className="font-semibold text-sm uppercase tracking-widest flex items-center gap-2 text-primary"><Info size={15} aria-hidden="true"/>Conditions importantes — à lire avant de commander</p>
            <p className="text-sm leading-relaxed text-foreground">{menu.conditions}</p>
            <p className="text-[11px] text-muted-foreground border-t border-primary/20 pt-2 mt-2">En passant commande, vous confirmez avoir pris connaissance et accepté ces conditions ainsi que nos CGV.</p>
          </div>
          <div className="bg-secondary border border-border p-3 text-xs text-muted-foreground flex items-start gap-2"><Info size={12} className="flex-shrink-0 mt-0.5" aria-hidden="true"/>Remise de 10 % appliquée automatiquement pour tout groupe de {(menu.minPeople || menu.min_people || 4)+5} personnes ou plus.</div>
          {menu.stock===0 ? <div className="w-full py-3.5 bg-muted text-muted-foreground text-sm text-center" role="status">Ce menu est épuisé</div>
          : user ? <button onClick={onOrder} className="w-full py-3.5 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90 flex items-center justify-center gap-2"><ShoppingCart size={16} aria-hidden="true"/>Commander ce menu</button>
          : <div className="space-y-3"><div className="bg-secondary border border-border p-4 text-sm text-center" role="note"><Lock size={14} className="inline mr-2 text-muted-foreground" aria-hidden="true"/>Vous devez être connecté pour passer commande.</div><div className="grid grid-cols-2 gap-3"><button onClick={onAuth} className="py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90">Se connecter</button><button onClick={onAuth} className="py-2.5 border border-primary text-primary text-sm hover:bg-primary hover:text-primary-foreground transition-colors">Créer un compte</button></div></div>}
        </div>
      </div>
    </div>
  );
}