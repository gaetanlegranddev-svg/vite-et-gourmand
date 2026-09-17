// ============================================
// Vite & Gourmand — All Menus View Component
// ============================================
import { useState, useMemo } from "react";
import { SlidersHorizontal, UtensilsCrossed, AlertTriangle, Package } from "lucide-react";
import { ThemeBadge, RegimeBadge, StockIndicator } from "./Badges.tsx";

type Theme = "Noël" | "Pâques" | "classique" | "événement";
type Regime = "classique" | "végétarien" | "vegan" | "sans gluten" | "halal";
interface Dish { id: string; name: string; type: string; allergens: string[] }
interface MenuData {
  id: string; title: string; images: string[]; description: string;
  theme: string; dishIds: string[]; minPeople: number; min_people: number;
  price: number; conditions: string; regime: string; stock: number;
  active: boolean; minOrderDays: number; storage: string;
}
interface Filters { priceMin: string; priceMax: string; theme: string; regime: string; minPeople: string }

const DEFAULT_FILTERS: Filters = { priceMin:"", priceMax:"", theme:"all", regime:"all", minPeople:"" };
const THEMES = ["Noël","Pâques","classique","événement"];
const REGIMES = ["classique","végétarien","vegan","sans gluten","halal"];
const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";

export default function AllMenusView({ menus, dishes, onDetail }: { menus:MenuData[]; dishes:Dish[]; onDetail:(id:string)=>void }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const maxPrice = Math.max(...menus.map(m=>m.price),0);
  const filtered = useMemo(() => menus.filter(m=>{
    if (!m.active) return false;
    if (filters.priceMin!=="" && m.price<+filters.priceMin) return false;
    if (filters.priceMax!=="" && m.price>+filters.priceMax) return false;
    if (filters.theme!=="all" && (m.theme!==filters.theme && m.theme!==filters.theme.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) return false;
    if (filters.regime!=="all" && (m.regime!==filters.regime && m.regime!==filters.regime.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) return false;
    if (filters.minPeople!=="" && (m.minPeople||m.min_people||4)>+filters.minPeople) return false;
    return true;
  }), [menus,filters]);
  const activeCount = [filters.priceMin,filters.priceMax,filters.theme!=="all"?"x":"",filters.regime!=="all"?"x":"",filters.minPeople].filter(Boolean).length;
  const ic = "bg-input-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8"><p className="text-xs tracking-widest uppercase text-accent mb-2">Saison automne-hiver 2026</p><h1 className="text-4xl md:text-5xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Tous nos menus</h1><p className="text-muted-foreground mt-3 max-w-xl">Composez votre repas parmi nos formules de saison, élaborées avec des produits locaux.</p></div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">{filtered.length} menu{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</p>
        <button onClick={()=>setShowFilters(v=>!v)} aria-expanded={showFilters} aria-controls="filters-panel" className={`flex items-center gap-2 px-4 py-2 border text-sm transition-colors ${showFilters?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary"}`}><SlidersHorizontal size={14} aria-hidden="true"/>Filtres{activeCount>0 && <span aria-label={`${activeCount} filtre${activeCount>1?"s":""} actif${activeCount>1?"s":""}`} className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">{activeCount}</span>}</button>
      </div>
      {showFilters && (
        <div id="filters-panel" className="bg-card border border-border p-6 mb-8 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 space-y-2"><label className="text-xs tracking-widest uppercase text-muted-foreground">Fourchette de prix (€)</label><div className="flex items-center gap-3"><div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1" aria-hidden="true">Min</p><input type="number" min={0} placeholder="0" value={filters.priceMin} onChange={e=>setFilters(f=>({...f,priceMin:e.target.value}))} className={ic} aria-label="Prix minimum en euros"/></div><span aria-hidden="true" className="text-muted-foreground mt-4">—</span><div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1" aria-hidden="true">Max</p><input type="number" min={0} placeholder={String(maxPrice)} value={filters.priceMax} onChange={e=>setFilters(f=>({...f,priceMax:e.target.value}))} className={ic} aria-label="Prix maximum en euros"/></div></div></div>
<div className="space-y-2"><label htmlFor="filter-people" className="text-xs tracking-widest uppercase text-muted-foreground">Taille de mon groupe</label><p className="text-[10px] text-muted-foreground mb-1 invisible">_</p><input id="filter-people" type="number" min={1} placeholder="Ex : 6" value={filters.minPeople} onChange={e=>setFilters(f=>({...f,minPeople:e.target.value}))} className={ic}/></div>          </div>
          <fieldset className="space-y-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Thème</legend><div className="flex flex-wrap gap-2 mt-1">{(["all",...THEMES] as const).map(t=><button key={t} onClick={()=>setFilters(f=>({...f,theme:t}))} aria-pressed={filters.theme===t} className={`px-3 py-1.5 text-xs tracking-wider uppercase border transition-colors ${filters.theme===t?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:border-primary"}`}>{t==="all"?"Tous":t}</button>)}</div></fieldset>
          <fieldset className="space-y-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Régime alimentaire</legend><div className="flex flex-wrap gap-2 mt-1">{(["all",...REGIMES] as const).map(r=><button key={r} onClick={()=>setFilters(f=>({...f,regime:r}))} aria-pressed={filters.regime===r} className={`px-3 py-1.5 text-xs tracking-wider uppercase border transition-colors ${filters.regime===r?"bg-accent text-accent-foreground border-accent":"border-border text-muted-foreground hover:border-accent"}`}>{r==="all"?"Tous régimes":r}</button>)}</div></fieldset>
          <button onClick={()=>setFilters(DEFAULT_FILTERS)} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">Réinitialiser les filtres</button>
        </div>
      )}
      {filtered.length===0 ? (
        <div className="text-center py-24 text-muted-foreground"><Package size={40} className="mx-auto mb-4 opacity-30" aria-hidden="true"/><p className="font-medium">Aucun menu ne correspond à ces critères.</p><button onClick={()=>setFilters(DEFAULT_FILTERS)} className="mt-4 text-sm text-accent underline-offset-4 hover:underline">Réinitialiser les filtres</button></div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none">
          {filtered.map(m=>{
            const md=dishes.filter(d=>(m.dishIds || []).includes(d.id));
            const allergens=[...new Set(md.flatMap(d=>d.allergens))];
            return (
              <li key={m.id}>
                <article className="bg-card border border-border flex flex-col group hover:shadow-md transition-shadow h-full">
                  <div className="relative overflow-hidden h-48 bg-muted"><button onClick={()=>onDetail(m.id)} className="w-full h-full" aria-label={`Voir le détail du menu ${m.title}`}><img src={(m.images?.[0]) || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format'} alt={m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/></button><div className="absolute top-3 left-3 flex gap-1.5 flex-wrap" aria-hidden="true"><ThemeBadge theme={m.theme}/><RegimeBadge regime={m.regime}/></div>{m.images && m.images.length>1 && <span className="absolute bottom-2 right-2 text-[10px] bg-background/80 px-1.5 py-0.5" aria-hidden="true">{m.images.length} photos</span>}</div>
                  <div className="flex flex-col flex-1 p-5 gap-4">
                    <div><h2 className="text-lg font-semibold leading-snug" style={{fontFamily:"'Playfair Display',serif"}}>{m.title}</h2><p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{m.description}</p></div>
                    <div className="flex gap-5 text-sm border-y border-border py-3"><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pers. min.</p><p className="font-semibold mt-0.5 flex items-center gap-1"><UtensilsCrossed size={13} className="text-muted-foreground" aria-hidden="true"/>{(m.minPeople || m.min_people || 4)}</p></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prix</p><p className="font-semibold text-primary mt-0.5" style={{fontFamily:"'Playfair Display',serif"}}>{fmt(m.price)}</p></div><div className="ml-auto self-center"><StockIndicator stock={m.stock}/></div></div>
                    {allergens.length>0 && <p className="text-xs text-amber-600 flex items-start gap-1.5"><AlertTriangle size={11} className="flex-shrink-0 mt-0.5" aria-hidden="true"/><span><span className="sr-only">Allergènes : </span>{allergens.slice(0,3).join(", ")}{allergens.length>3?` +${allergens.length-3}`:""}</span></p>}
                    <button onClick={()=>onDetail(m.id)} className="mt-auto w-full py-2.5 border border-primary text-primary text-sm hover:bg-primary hover:text-primary-foreground transition-colors">Voir le détail du menu</button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}