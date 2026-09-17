// ============================================
// Vite & Gourmand — Footer Component
// ============================================
import { Clock, FileText, Lock } from "lucide-react";

interface HourSlot { day: string; time: string }

interface FooterProps {
  hours: HourSlot[];
  onLegal: (t: "mentions" | "cgv") => void;
}

export default function Footer({ hours, onLegal }: FooterProps) {
  const todayIdx = new Date().getDay();
  const order = [1,2,3,4,5,6,0];
  return (
    <footer className="bg-foreground text-background/70">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div><p className="text-xl font-semibold text-background mb-1" style={{fontFamily:"'Playfair Display',serif"}}>Vite &amp; Gourmand</p><p className="text-xs tracking-widest uppercase text-background/40 mb-4">Traiteur artisanal — Bordeaux</p><address className="not-italic text-sm leading-relaxed">12 rue des Chartrons<br/>33000 Bordeaux<br/><a href="tel:+33556123456" className="hover:text-background">05 56 12 34 56</a></address></div>
          <nav aria-label="Horaires d'ouverture">
            <p className="flex items-center gap-2 text-xs tracking-widest uppercase text-background/40 mb-4"><Clock size={12} aria-hidden="true"/>Horaires</p>
            <ul className="space-y-1.5 text-sm">{order.map(i=>{ const h=hours[i===0?6:i-1]; const isToday=i===todayIdx; return <li key={h.day} className={`flex justify-between gap-4 ${isToday?"text-background font-medium":""}`}><span>{h.day}{isToday&&<span className="ml-1.5 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 align-middle" aria-label="Aujourd'hui">Auj.</span>}</span><span className={isToday?"text-accent":""}>{h.time}</span></li>; })}</ul>
          </nav>
          <nav aria-label="Liens légaux">
            <p className="text-xs tracking-widest uppercase text-background/40 mb-4">Informations légales</p>
            <ul className="space-y-2 text-sm list-none"><li><button onClick={()=>onLegal("mentions")} className="flex items-center gap-2 hover:text-background transition-colors"><FileText size={13} aria-hidden="true"/>Mentions légales</button></li><li><button onClick={()=>onLegal("cgv")} className="flex items-center gap-2 hover:text-background transition-colors"><FileText size={13} aria-hidden="true"/>CGV</button></li><li><a href="mailto:rgpd@viteetgourmand.fr" className="flex items-center gap-2 hover:text-background transition-colors"><Lock size={13} aria-hidden="true"/>rgpd@viteetgourmand.fr</a></li></ul>
          </nav>
        </div>
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/30"><p>© 2001–2026 Vite &amp; Gourmand — Tous droits réservés</p><p>Site conforme RGPD &amp; RGAA · Données hébergées en France</p></div>
      </div>
    </footer>
  );
}