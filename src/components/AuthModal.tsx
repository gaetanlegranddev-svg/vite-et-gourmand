// ============================================
// Vite & Gourmand — Auth Modal Component
// ============================================
import { useState } from "react";
import { X, Eye, EyeOff, AlertTriangle, ArrowLeft, Mail, Lock, CircleCheck } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { PasswordStrengthBar } from "./Badges.tsx";
import { login, register } from "../services/authService.js";

type AuthTab = "login" | "register" | "forgot";
type Role = "utilisateur" | "employee" | "admin";
interface AuthUser { name: string; email: string; role: Role; address?: string; phone?: string }

function validatePassword(pw: string): string[] {
  const e: string[] = [];
  if (pw.length < 10) e.push("10 caractères minimum");
  if (!/[A-Z]/.test(pw)) e.push("une majuscule");
  if (!/[a-z]/.test(pw)) e.push("une minuscule");
  if (!/[0-9]/.test(pw)) e.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("un caractère spécial");
  return e;
}

export default function AuthModal({ onClose, onLogin, initialTab="login" }: { onClose:()=>void; onLogin:(u:AuthUser)=>void; initialTab?: AuthTab }) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [showPw, setShowPw] = useState(false); const [loginErr, setLoginErr] = useState("");
  const [reg, setReg] = useState({ firstName:"",lastName:"",email:"",phone:"",address:"",password:"",confirm:"" });
  const [showRegPw, setShowRegPw] = useState(false); const [regErrors, setRegErrors] = useState<string[]>([]); const [regOk, setRegOk] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(""); const [forgotSent, setForgotSent] = useState(false);
  const trapRef = useFocusTrap(true);
  const ic = "w-full bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  try {
    const data = await login(email, pw);
    onLogin({ 
      name: `${data.user.firstName} ${data.user.lastName}`, 
      email: data.user.email, 
      role: data.user.role,
      address: data.user.address,
      phone: data.user.phone
    });
    onClose();
  } catch (err: any) {
    setLoginErr(err.message || "Identifiants incorrects.");
  }
  }
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!reg.firstName.trim()) errs.push("Prénom requis");
    if (!reg.lastName.trim()) errs.push("Nom requis");
    if (!reg.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) errs.push("E-mail invalide");
    if (!reg.phone.trim() || !/^[\d\s+().,-]{7,20}$/.test(reg.phone)) errs.push("Numéro de téléphone invalide");
    if (!reg.address.trim()) errs.push("Adresse postale requise");
    const pe = validatePassword(reg.password); if (pe.length) errs.push("Mot de passe : "+pe.join(", "));
    if (reg.password !== reg.confirm) errs.push("Les mots de passe ne correspondent pas");
    if (errs.length) { setRegErrors(errs); return; }
    try {
      await register({
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        phone: reg.phone,
        address: reg.address,
        password: reg.password
      });
      setRegOk(true);
    } catch (err: any) {
      setRegErrors([err.message || "Erreur lors de la création du compte"]);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Connexion ou création de compte">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-md mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex border-b border-border flex-shrink-0">
          {(["login","register"] as AuthTab[]).map(t=><button key={t} onClick={()=>{ setTab(t); setLoginErr(""); setRegErrors([]); }} aria-selected={tab===t} role="tab" className={`flex-1 py-3.5 text-sm transition-colors ${tab===t?"border-b-2 border-primary text-foreground font-medium":"text-muted-foreground hover:text-foreground"}`}>{t==="login"?"Connexion":"Créer un compte"}</button>)}
          <button onClick={onClose} aria-label="Fermer la fenêtre de connexion" className="px-4 text-muted-foreground hover:text-foreground flex-shrink-0"><X size={16} aria-hidden="true"/></button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          {tab==="login" && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1.5"><label htmlFor="lg-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail</label><input id="lg-email" type="email" autoComplete="email" required value={email} onChange={e=>{setEmail(e.target.value);setLoginErr("");}} className={ic} placeholder="votre@mail.fr" aria-describedby={loginErr?"lg-err":undefined}/></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="lg-pw" className="text-xs tracking-widest uppercase text-muted-foreground">Mot de passe</label><div className="relative"><input id="lg-pw" type={showPw?"text":"password"} autoComplete="current-password" required value={pw} onChange={e=>{setPw(e.target.value);setLoginErr("");}} className={ic+" pr-10"}/><button type="button" aria-label={showPw?"Masquer le mot de passe":"Afficher le mot de passe"} onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw?<EyeOff size={14} aria-hidden="true"/>:<Eye size={14} aria-hidden="true"/>}</button></div></div>
              {loginErr && <p id="lg-err" role="alert" className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={12} aria-hidden="true"/>{loginErr}</p>}
              <button type="submit" className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Se connecter</button>
              <button type="button" onClick={()=>setTab("forgot")} className="w-full text-xs text-muted-foreground hover:text-accent underline-offset-4 hover:underline text-center">Mot de passe oublié ?</button>
              <details className="mt-1"><summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">Comptes démo</summary><div className="mt-2 text-[11px] text-muted-foreground space-y-0.5 bg-secondary p-3"><p>admin@viteetgourmand.fr / Admin1234!</p><p>employe@viteetgourmand.fr / Employe1!</p><p>user@exemple.fr / User1234!</p></div></details>
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border leading-relaxed">Données traitées conformément au RGPD.</p>
            </form>
          )}
          {tab==="forgot" && (
            forgotSent ? (
              <div className="flex flex-col items-center text-center gap-4 py-6" aria-live="polite">
                <div className="w-14 h-14 bg-blue-50 flex items-center justify-center rounded-full" aria-hidden="true"><Mail size={24} className="text-blue-500"/></div>
                <h3 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>E-mail envoyé</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Un lien de réinitialisation a été envoyé à <strong>{forgotEmail}</strong>.</p>
                <button onClick={()=>setTab("login")} className="text-sm text-accent underline-offset-4 hover:underline">Retour à la connexion</button>
              </div>
            ) : (
              <form onSubmit={e=>{e.preventDefault();setForgotSent(true);}} className="space-y-4" noValidate>
                <div className="flex items-center gap-2 mb-2"><button type="button" onClick={()=>setTab("login")} aria-label="Retour à la connexion" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={16} aria-hidden="true"/></button><h3 className="font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Réinitialiser</h3></div>
                <p className="text-sm text-muted-foreground">Saisissez votre e-mail pour recevoir un lien de réinitialisation.</p>
                <div className="flex flex-col gap-1.5"><label htmlFor="forgot-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail</label><input id="forgot-email" type="email" required value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} className={ic} placeholder="votre@mail.fr"/></div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Envoyer le lien</button>
              </form>
            )
          )}
          {tab==="register" && (
            regOk ? (
              <div className="flex flex-col items-center text-center gap-4 py-6" aria-live="polite">
                <div className="w-14 h-14 bg-emerald-100 flex items-center justify-center rounded-full" aria-hidden="true"><CircleCheck size={28} className="text-emerald-600"/></div>
                <h3 className="text-xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Bienvenue !</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Compte créé. Un e-mail de bienvenue a été envoyé à <strong>{reg.email}</strong>.</p>
                <button onClick={()=>{ setTab("login"); setEmail(reg.email); }} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90">Se connecter</button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5"><label htmlFor="rg-fn" className="text-xs tracking-widest uppercase text-muted-foreground">Prénom *</label><input id="rg-fn" required value={reg.firstName} onChange={e=>setReg(r=>({...r,firstName:e.target.value}))} className={ic} placeholder="Marie" autoComplete="given-name"/></div>
                  <div className="flex flex-col gap-1.5"><label htmlFor="rg-ln" className="text-xs tracking-widest uppercase text-muted-foreground">Nom *</label><input id="rg-ln" required value={reg.lastName} onChange={e=>setReg(r=>({...r,lastName:e.target.value}))} className={ic} placeholder="Dupont" autoComplete="family-name"/></div>
                </div>
                <div className="flex flex-col gap-1.5"><label htmlFor="rg-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail *</label><input id="rg-email" type="email" required value={reg.email} onChange={e=>setReg(r=>({...r,email:e.target.value}))} className={ic} autoComplete="email"/></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="rg-phone" className="text-xs tracking-widest uppercase text-muted-foreground">Téléphone *</label><input id="rg-phone" type="tel" required value={reg.phone} onChange={e=>setReg(r=>({...r,phone:e.target.value}))} className={ic} placeholder="+33 6 XX XX XX XX" autoComplete="tel"/></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="rg-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse postale *</label><input id="rg-addr" required value={reg.address} onChange={e=>setReg(r=>({...r,address:e.target.value}))} className={ic} autoComplete="street-address"/></div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rg-pw" className="text-xs tracking-widest uppercase text-muted-foreground">Mot de passe *</label>
                  <div className="relative"><input id="rg-pw" type={showRegPw?"text":"password"} required value={reg.password} onChange={e=>setReg(r=>({...r,password:e.target.value}))} className={ic+" pr-10"} autoComplete="new-password" aria-describedby="rg-pw-hint"/><button type="button" aria-label={showRegPw?"Masquer":"Afficher"} onClick={()=>setShowRegPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showRegPw?<EyeOff size={14} aria-hidden="true"/>:<Eye size={14} aria-hidden="true"/>}</button></div>
                  {reg.password && <PasswordStrengthBar pw={reg.password}/>}
                  <p id="rg-pw-hint" className="text-[11px] text-muted-foreground">Min. 10 car., majuscule, minuscule, chiffre, caractère spécial.</p>
                </div>
                <div className="flex flex-col gap-1.5"><label htmlFor="rg-confirm" className="text-xs tracking-widest uppercase text-muted-foreground">Confirmer *</label><input id="rg-confirm" type="password" required value={reg.confirm} onChange={e=>setReg(r=>({...r,confirm:e.target.value}))} className={ic} autoComplete="new-password"/>{reg.confirm && reg.password!==reg.confirm && <p role="alert" className="text-[11px] text-red-500">Les mots de passe ne correspondent pas</p>}</div>
                {regErrors.length>0 && <ul role="alert" className="bg-red-50 border border-red-200 p-3 space-y-1">{regErrors.map((e,i)=><li key={i} className="text-xs text-red-600 flex items-start gap-1.5"><AlertTriangle size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true"/>{e}</li>)}</ul>}
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Créer mon compte</button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">En créant un compte, vous acceptez nos CGV et notre politique de confidentialité (RGPD).</p>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
