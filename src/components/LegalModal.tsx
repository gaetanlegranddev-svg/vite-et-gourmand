// ============================================
// Vite & Gourmand — Legal Modal Component
// ============================================
import { X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";

interface LegalModalProps {
  type: "mentions" | "cgv";
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const trapRef = useFocusTrap(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={type==="mentions"?"Mentions légales":"Conditions Générales de Vente"}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border flex-shrink-0"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>{type==="mentions"?"Mentions légales":"Conditions Générales de Vente"}</h2><button onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground"><X size={18} aria-hidden="true"/></button></div>
        <div className="overflow-y-auto px-8 py-6 text-sm text-muted-foreground leading-relaxed space-y-5">
          {type==="mentions" ? (<><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>Éditeur</h3><p>Vite &amp; Gourmand — SARL au capital de 10 000 €<br/>12 rue des Chartrons, 33000 Bordeaux — SIRET : 498 765 432 00018<br/>Directrice de publication : Julie Martin — 05 56 12 34 56</p></section><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>RGPD</h3><p>Données collectées traitées pour la gestion des commandes. Non cédées à des tiers. Droits d&apos;accès : rgpd@viteetgourmand.fr.</p></section></>)
          : (<><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>1. Prix et livraison</h3><p>Prix TTC en euros. Livraison à Bordeaux : 5 € (base) + 0,59 €/km si hors Bordeaux.</p></section><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>2. Remise</h3><p>Remise de 10 % pour tout groupe comptant 5 personnes ou plus au-delà du minimum du menu.</p></section><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>3. Prêt de matériel</h3><p>En cas de prêt de matériel, le client dispose de <strong>10 jours ouvrés</strong> pour le restituer. Passé ce délai, des frais de <strong>600 € TTC</strong> seront facturés.</p></section><section><h3 className="text-foreground font-medium mb-2" style={{fontFamily:"'Playfair Display',serif"}}>4. Annulation</h3><p>Plus de 72 h : remboursement intégral. 48–72 h : 50 % de l&apos;acompte retenu. Moins de 48 h : acompte non remboursable.</p></section></>)}
        </div>
      </div>
    </div>
  );
}