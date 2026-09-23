// ============================================
// Vite & Gourmand — Stats Tab Component
// ============================================
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, BarChart2, CalendarDays, Star, RefreshCw } from "lucide-react";

const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
const CHART_COLORS = ["#7A1C1C","#B8832A","#4A7C59","#3B6FA0","#8B5E3C","#5B3A7E"];

interface Order { [key: string]: any; }
interface MenuData { id: string; title: string; [key: string]: any; }

// ── Stats Tab (admin only) ─────────────────────────────────────────────────────

export default function StatsTab({ menus, orders }: { menus:MenuData[]; orders:Order[] }) {
  const [revMenuFilter, setRevMenuFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const ic = "bg-input-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  const validOrders = orders.filter(o=>o.currentStatus!=="annulée");
  const orderCountData = menus.map(m=>({
    name: m.title.length>22 ? m.title.slice(0,22)+"…" : m.title,
    commandes: validOrders.filter(o=>o.menuId===m.id).length,
  })).sort((a,b)=>b.commandes-a.commandes);

  const revenueOrders = validOrders.filter(o=>{
    if (revMenuFilter!=="all" && o.menuId!==revMenuFilter) return false;
    if (dateFrom && o.eventDate<dateFrom) return false;
    if (dateTo && o.eventDate>dateTo) return false;
    return true;
  });
  const totalCA = revenueOrders.reduce((s,o)=>s+(parseFloat(o.total)||0),0);

  const revenueData = menus.map(m=>{
    const mOrders = revenueOrders.filter(o=>o.menuId===m.id);
    return { name:m.title.length>18?m.title.slice(0,18)+"…":m.title, ca:+mOrders.reduce((s,o)=>s+o.total,0).toFixed(2), commandes:mOrders.length };
  }).filter(d=>d.commandes>0);

  return (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-3 gap-4">
        {[{ label:"Commandes totales", value:String(validOrders.length), icon:<BarChart2 size={20} aria-hidden="true"/> },{ label:"Chiffre d'affaires total", value:fmt(validOrders.reduce((s,o)=>s+o.total,0)), icon:<TrendingUp size={20} aria-hidden="true"/> },{ label:"Avis clients reçus", value:String(orders.filter(o=>o.review).length), icon:<Star size={20} aria-hidden="true"/> }].map(({ label,value,icon })=>(
          <div key={label} className="bg-card border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center text-accent flex-shrink-0">{icon}</div>
            <div><p className="text-xs tracking-widest uppercase text-muted-foreground">{label}</p><p className="text-2xl font-semibold mt-1" style={{fontFamily:"'Playfair Display',serif"}}>{value}</p></div>
          </div>
        ))}
      </div>

      <section aria-label="Commandes par menu">
        <h2 className="text-lg font-semibold mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Commandes par menu</h2>
        {validOrders.length===0 ? <p className="text-muted-foreground text-sm">Aucune commande validée.</p> : (
          <div className="bg-card border border-border p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderCountData} layout="vertical" margin={{left:0,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis type="number" tick={{fontSize:12}} allowDecimals={false}/>
                <YAxis type="category" dataKey="name" width={160} tick={{fontSize:11}} />
                <Tooltip formatter={(v:number)=>[v,"Commandes"]} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontSize:12}}/>
                <Bar dataKey="commandes" radius={[0,4,4,0]}>
                  {orderCountData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section aria-label="Chiffre d'affaires par menu">
        <h2 className="text-lg font-semibold mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Chiffre d&apos;affaires</h2>
        <div className="bg-card border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]"><label htmlFor="rev-menu" className="text-xs tracking-widest uppercase text-muted-foreground">Filtrer par menu</label><select id="rev-menu" value={revMenuFilter} onChange={e=>setRevMenuFilter(e.target.value)} className={ic}><option value="all">Tous les menus</option>{menus.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="rev-from" className="text-xs tracking-widest uppercase text-muted-foreground">Du</label><input id="rev-from" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className={ic}/></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="rev-to" className="text-xs tracking-widest uppercase text-muted-foreground">Au</label><input id="rev-to" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className={ic}/></div>
          {(revMenuFilter!=="all"||dateFrom||dateTo)&&<button onClick={()=>{ setRevMenuFilter("all"); setDateFrom(""); setDateTo(""); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><RefreshCw size={13} aria-hidden="true"/>Réinitialiser</button>}
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border p-5"><p className="text-xs tracking-widest uppercase text-muted-foreground">CA filtré</p><p className="text-3xl font-semibold text-primary mt-1" style={{fontFamily:"'Playfair Display',serif"}} aria-live="polite">{fmt(totalCA)}</p><p className="text-xs text-muted-foreground mt-1">{revenueOrders.length} commande{revenueOrders.length>1?"s":""}</p></div>
          <div className="bg-card border border-border p-5"><p className="text-xs tracking-widest uppercase text-muted-foreground">Panier moyen</p><p className="text-3xl font-semibold mt-1" style={{fontFamily:"'Playfair Display',serif"}} aria-live="polite">{revenueOrders.length>0?fmt(totalCA/revenueOrders.length):"—"}</p></div>
        </div>
        {revenueData.length>0 && (
          <div className="bg-card border border-border p-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} margin={{right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" tick={{fontSize:10}} interval={0}/>
                <YAxis tick={{fontSize:11}} tickFormatter={v=>`${v}€`}/>
                <Tooltip formatter={(v:number)=>[fmt(v),"CA"]} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontSize:12}}/>
                <Legend/>
                <Bar dataKey="ca" name="Chiffre d'affaires" radius={[4,4,0,0]}>
                  {revenueData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {revenueData.length>1 && (
          <div className="bg-card border border-border p-6 mt-4">
            <p className="text-sm text-muted-foreground mb-4">Répartition du CA par menu</p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={revenueData} dataKey="ca" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                    {revenueData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v:number)=>[fmt(v),"CA"]} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",fontSize:12}}/>
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 text-sm flex-1">
                {revenueData.map((d,i)=>(
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:CHART_COLORS[i%CHART_COLORS.length]}} aria-hidden="true"/>
                    <span className="flex-1 text-muted-foreground truncate">{d.name}</span>
                    <span className="font-medium flex-shrink-0">{fmt(d.ca)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
