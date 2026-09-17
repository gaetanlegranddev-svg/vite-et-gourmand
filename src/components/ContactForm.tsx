// ============================================
// Vite & Gourmand — Contact Form Component
// ============================================
import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { apiFetch } from "../services/api.js";

export default function ContactFormBlock() {
  const [f,setF]=useState({ titre:"", description:"", email:"" });
  const [sent,setSent]=useState(false);
  const [emailErr,setEmailErr]=useState("");
  const ic="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
  if(sent) return (
    <div className="bg-card border border-border p-8 flex flex-col items-center justify-center min-h-[320px] text-center gap-4" role="status" aria-live="polite">
      <div className="w-12 h-12 bg-accent flex items-center justify-center" aria-hidden="true"><Check size={24} className="text-accent-foreground"/></div>
      <h2 className="text-xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Message envoyé !</h2>
      <p className="text-sm text-muted-foreground">Votre message a bien été transmis à l&apos;équipe de Vite &amp; Gourmand. Vous recevrez une réponse à l&apos;adresse <strong>{f.email}</strong> sous 24 h.</p>
      <button onClick={()=>{ setSent(false); setF({titre:"",description:"",email:""}); }} className="text-xs text-accent underline-offset-4 hover:underline">Envoyer un nouveau message</button>
    </div>
  );
  return (
    <div className="bg-card border border-border p-8">
      <form onSubmit={async e=>{ e.preventDefault(); if(!f.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){setEmailErr("Veuillez entrer un email valide.");return;} setEmailErr(""); try { await apiFetch('/contact', { method:'POST', body:JSON.stringify(f) }); setSent(true); } catch(err) { console.error(err); setSent(true); } }} className="space-y-5" noValidate aria-label="Formulaire de contact">
        <h2 className="text-xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Formulaire de contact</h2>
        <div className="flex flex-col gap-1.5"><label htmlFor="ct-titre" className="text-xs tracking-widest uppercase text-muted-foreground">Titre / Objet *</label><input id="ct-titre" type="text" required value={f.titre} onChange={e=>setF(x=>({...x,titre:e.target.value}))} className={ic} placeholder="Ex : Demande de devis — anniversaire 20 personnes" aria-required="true"/></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="ct-email" className="text-xs tracking-widest uppercase text-muted-foreground">Votre adresse e-mail *</label><input id="ct-email" type="email" required value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))} className={ic} placeholder="votre@mail.fr" autoComplete="email" aria-required="true"/>{emailErr&&<p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12}/>{emailErr}</p>}</div>
        <div className="flex flex-col gap-1.5"><label htmlFor="ct-desc" className="text-xs tracking-widest uppercase text-muted-foreground">Description *</label><textarea id="ct-desc" rows={5} required value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))} className={ic+" resize-none"} placeholder="Décrivez votre événement, vos besoins, la date envisagée..." aria-required="true"/></div>
        <p className="text-[11px] text-muted-foreground">Votre message sera transmis par e-mail à l&apos;équipe Vite &amp; Gourmand. Données traitées conformément au RGPD.</p>
        <button type="submit" className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Envoyer le message</button>
      </form>
    </div>
  );
}