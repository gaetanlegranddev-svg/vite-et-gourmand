// ============================================
// Vite & Gourmand — Team Tab Component
// ============================================
import { useState } from "react";
import { Users, ShieldCheck, ShieldOff, Plus, X, Check, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { validatePassword, getDisabledEmails, setDisabledEmails, allUsers } from "../utils/helpers.ts";
import { PasswordStrengthBar } from "./Badges.tsx";


interface AuthUser { name: string; email: string; role: string; }
interface RegisteredUser { id: string; firstName: string; lastName: string; email: string; phone: string; address: string; password: string; role: string; }

// ── Team Tab (admin only) ──────────────────────────────────────────────────────

export default function TeamTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [disabled, setDisabledState] = useState<string[]>(getDisabledEmails);
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"" });
  const [errors, setErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<{name:string; email:string}|null>(null);
  const [showPw, setShowPw] = useState(false);
  const ic = "bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";

  const employees = allUsers().filter(u=>u.role==="employee"||u.role==="admin");

  function toggleDisable(email: string) {
    const next = disabled.includes(email) ? disabled.filter(e=>e!==email) : [...disabled, email];
    setDisabledEmails(next);
    setDisabledState(next);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!form.firstName.trim()) errs.push("Prénom requis");
    if (!form.lastName.trim()) errs.push("Nom requis");
    if (!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push("E-mail invalide");
    const pe = validatePassword(form.password); if (pe.length) errs.push("Mot de passe : "+pe.join(", "));
    if (allUsers().find(u=>u.email.toLowerCase()===form.email.toLowerCase())) errs.push("E-mail déjà utilisé");
    if (errs.length) { setErrors(errs); return; }
    const stored: RegisteredUser[] = JSON.parse(sessionStorage.getItem("vg_users")||"[]");
    sessionStorage.setItem("vg_users", JSON.stringify([...stored, { id:uid(), firstName:form.firstName, lastName:form.lastName, email:form.email, phone:"", address:"", password:form.password, role:"employee" as Role }]));
    setCreated({ name:`${form.firstName} ${form.lastName}`, email:form.email });
    setForm({ firstName:"", lastName:"", email:"", password:"" });
    setErrors([]);
    setShowCreate(false);
  }

  return (
    <div className="space-y-6">
      {created && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CircleCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true"/>
          <div className="text-sm"><p className="font-semibold text-emerald-700">Compte employé créé pour {created.name}</p><p className="text-emerald-700 mt-0.5">Une notification e-mail a été envoyée à <strong>{created.email}</strong> l&apos;informant de la création de son compte. <strong>Le mot de passe ne lui a pas été communiqué</strong> — l&apos;employé doit vous contacter pour l&apos;obtenir.</p><button className="text-xs text-emerald-600 underline-offset-4 hover:underline mt-1" onClick={()=>setCreated(null)}>Fermer</button></div>
        </div>
      )}
      <div className="bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2" role="note">
        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true"/>
        <span>La création de comptes <strong>Administrateur</strong> n&apos;est pas disponible depuis l&apos;application. Contactez le service technique si nécessaire.</span>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Équipe ({employees.length})</h2>
        <button onClick={()=>setShowCreate(v=>!v)} aria-expanded={showCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm hover:opacity-90"><Plus size={14} aria-hidden="true"/>Créer un compte employé</button>
      </div>
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card border border-border p-6 space-y-4" noValidate aria-label="Formulaire de création d'un compte employé">
          <h3 className="font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Nouveau compte employé</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="emp-fn" className="text-xs tracking-widest uppercase text-muted-foreground">Prénom *</label><input id="emp-fn" required value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="emp-ln" className="text-xs tracking-widest uppercase text-muted-foreground">Nom *</label><input id="emp-ln" required value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="emp-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail (identifiant) *</label><input id="emp-email" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className={ic} placeholder="prenom@viteetgourmand.fr"/></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="emp-pw" className="text-xs tracking-widest uppercase text-muted-foreground">Mot de passe temporaire *</label><div className="relative"><input id="emp-pw" type={showPw?"text":"password"} required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} className={ic+" pr-10"} autoComplete="off"/><button type="button" aria-label={showPw?"Masquer":"Afficher"} onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw?<EyeOff size={14} aria-hidden="true"/>:<Eye size={14} aria-hidden="true"/>}</button></div>{form.password&&<PasswordStrengthBar pw={form.password}/>}</div>
          </div>
          {errors.length>0&&<ul role="alert" className="bg-red-50 border border-red-200 p-3 space-y-1">{errors.map((e,i)=><li key={i} className="text-xs text-red-600 flex items-start gap-1.5"><AlertTriangle size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true"/>{e}</li>)}</ul>}
          <div className="bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800"><strong>Important :</strong> L&apos;employé recevra un e-mail l&apos;informant de la création de son compte. Le mot de passe <strong>ne sera pas inclus</strong> dans ce mail. Communiquez-le directement à l&apos;employé en personne.</div>
          <div className="flex gap-3"><button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Créer le compte</button><button type="button" onClick={()=>{ setShowCreate(false); setErrors([]); }} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button></div>
        </form>
      )}
      <div className="border border-border overflow-x-auto" role="region" aria-label="Liste de l'équipe">
        <table className="w-full text-sm min-w-[500px]">
          <caption className="sr-only">Membres de l&apos;équipe Vite &amp; Gourmand</caption>
          <thead className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="text-left px-4 py-3 font-medium" scope="col">Nom</th><th className="text-left px-4 py-3 font-medium" scope="col">E-mail</th><th className="text-left px-4 py-3 font-medium" scope="col">Rôle</th><th className="text-left px-4 py-3 font-medium" scope="col">Statut</th><th className="px-4 py-3 font-medium" scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody className="divide-y divide-border">
            {employees.map(u=>{
              const isDisabled=disabled.includes(u.email);
              const isSelf=u.role==="admin";
              return (
                <tr key={u.id} className={`hover:bg-secondary/50 transition-colors ${isDisabled?"opacity-60":""}`}>
                  <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 border font-medium ${isDisabled?"bg-red-50 border-red-200 text-red-600":"bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{isDisabled?"Désactivé":"Actif"}</span></td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf ? (
                      <button onClick={()=>toggleDisable(u.email)} aria-label={isDisabled?`Réactiver le compte de ${u.firstName} ${u.lastName}`:`Désactiver le compte de ${u.firstName} ${u.lastName}`} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors ml-auto ${isDisabled?"border-emerald-300 text-emerald-700 hover:bg-emerald-50":"border-red-300 text-red-600 hover:bg-red-50"}`}>
                        {isDisabled?<><ShieldCheck size={13} aria-hidden="true"/>Réactiver</>:<><ShieldOff size={13} aria-hidden="true"/>Désactiver</>}
                      </button>
                    ) : <span className="text-xs text-muted-foreground italic">Compte principal</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
