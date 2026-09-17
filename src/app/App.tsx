import { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingCart, X, ChevronDown, Phone, Mail, MapPin, Plus, Minus,
  Check, Menu as MenuIcon, ChevronLeft, ChevronRight, Eye, EyeOff,
  Edit2, Trash2, LogOut, Lock, User, Clock, FileText, AlertTriangle,
  ArrowLeft, Package, Settings, Leaf, UtensilsCrossed, Image as ImageIcon,
  SlidersHorizontal, CircleCheck, Info, Star, Pencil, Truck, ChevronRight as CR,
  ReceiptText, UserCircle, ClipboardList, Ban, Search, Filter,
  ThumbsUp, ThumbsDown, MessageSquare, Box, RefreshCw, Users,
  BarChart2, TrendingUp, ShieldOff, ShieldCheck, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getMenus, getDishes } from '../services/menuService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrder } from '../services/orderService.js';
import { login, register } from '../services/authService.js';
import { apiFetch } from '../services/api.js';
import Footer from '../components/Footer.tsx';
import { ThemeBadge, RegimeBadge, StockIndicator, StatusBadge, StarRating, PasswordStrengthBar } from '../components/Badges.tsx';
import ContactFormBlock from '../components/ContactForm.tsx';
import ImageGallery from '../components/ImageGallery.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';
import ReviewModal from '../components/ReviewModal.tsx';
import AuthModal from '../components/AuthModal.tsx';
import AllMenusView from '../components/AllMenusView.tsx';
// ── Types ──────────────────────────────────────────────────────────────────────

type View = "home" | "menus" | "menu-detail" | "admin" | "contact" | "order" | "user-space";
type Role = "utilisateur" | "employee" | "admin";
type Theme = "Noël" | "Pâques" | "classique" | "événement";
type Regime = "classique" | "végétarien" | "vegan" | "sans gluten" | "halal";
type DishType = "entrée" | "plat" | "dessert";
type AdminTab = "commandes" | "menus" | "plats" | "horaires" | "avis" | "equipe" | "statistiques";
type AuthTab = "login" | "register" | "forgot";
type UserTab = "commandes" | "profil";
type OrderStatus =
  | "en attente" | "accepté" | "en préparation"
  | "en cours de livraison" | "livré"
  | "en attente du retour de matériel" | "terminée" | "annulée";

interface RegisteredUser {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; address: string; password: string; role: Role;
}
interface AuthUser { name: string; email: string; role: Role; address?: string; phone?: string }
interface Dish { id: string; name: string; type: DishType; allergens: string[] }
interface MenuData {
  id: string; title: string; images: string[]; description: string;
  theme: Theme; dishIds: string[]; minPeople: number; price: number;
  conditions: string; regime: Regime; stock: number; active: boolean;
  minOrderDays: number; storage: string;
}
interface CartItem { menu: MenuData; qty: number }
interface StatusEntry { status: OrderStatus; at: string }
interface Review { rating: number; comment: string; at: string; validated?: boolean }
interface Order {
  id: string; userEmail: string;
  menuId: string; menuTitle: string; menuImage: string; menuMinPeople: number;
  firstName: string; lastName: string; email: string; phone: string;
  eventDate: string; deliveryTime: string; address: string; city: string;
  inBordeaux: boolean; distanceKm: number;
  people: number; menuSubtotal: number; deliveryFee: number; discount: number; total: number;
  notes: string; statusHistory: StatusEntry[]; currentStatus: OrderStatus;
  hasEquipmentLoan?: boolean;
  cancellationContactMode?: string; cancellationReason?: string;
  review?: Review;
}
interface HourSlot { day: string; time: string }
interface Filters { priceMin: string; priceMax: string; theme: Theme|"all"; regime: Regime|"all"; minPeople: string }

// ── Constants ──────────────────────────────────────────────────────────────────

const ALLERGENS = ["Gluten","Crustacés","Œufs","Poissons","Arachides","Soja","Lait","Fruits à coque","Céleri","Moutarde","Graines de sésame","Sulfites","Lupin","Mollusques"];
const THEMES: Theme[] = ["Noël","Pâques","classique","événement"];
const REGIMES: Regime[] = ["classique","végétarien","vegan","sans gluten","halal"];
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
const USER_TIMELINE: OrderStatus[] = ["en attente","accepté","en préparation","en cours de livraison","livré","terminée"];
const DEFAULT_FILTERS: Filters = { priceMin:"", priceMax:"", theme:"all", regime:"all", minPeople:"" };

// ── Seed / Initial Data ────────────────────────────────────────────────────────

const SEED_USERS: RegisteredUser[] = [
  { id:"u0", firstName:"Julie",  lastName:"Martin",    email:"admin@viteetgourmand.fr",   phone:"0556123456", address:"12 rue des Chartrons, 33000 Bordeaux",   password:"Admin1234!",  role:"admin" },
  { id:"u1", firstName:"José",   lastName:"Fernandez", email:"employe@viteetgourmand.fr", phone:"0612345678", address:"8 allée de Tourny, 33000 Bordeaux",      password:"Employe1!",   role:"employee" },
  { id:"u2", firstName:"Marie",  lastName:"Dupont",    email:"user@exemple.fr",           phone:"0698765432", address:"3 place de la Victoire, 33000 Bordeaux", password:"User1234!",   role:"utilisateur" },
];
const HOURS_INIT: HourSlot[] = [
  { day:"Lundi",    time:"8h – 19h" }, { day:"Mardi",    time:"8h – 19h" },
  { day:"Mercredi", time:"8h – 19h" }, { day:"Jeudi",    time:"8h – 19h" },
  { day:"Vendredi", time:"8h – 19h" }, { day:"Samedi",   time:"9h – 18h" },
  { day:"Dimanche", time:"10h – 14h (sur commande)" },
];
const INIT_DISHES: Dish[] = [
  { id:"de1", name:"Velouté de potimarron",             type:"entrée",  allergens:["Lait","Fruits à coque"] },
  { id:"de2", name:"Terrine maison aux herbes",          type:"entrée",  allergens:["Gluten","Œufs","Lait"] },
  { id:"de3", name:"Asperges blanches sauce mousseline", type:"entrée",  allergens:["Œufs","Lait"] },
  { id:"de4", name:"Carpaccio de saint-jacques",         type:"entrée",  allergens:["Mollusques"] },
  { id:"dp1", name:"Magret de canard aux cèpes",         type:"plat",    allergens:["Sulfites"] },
  { id:"dp2", name:"Dos de cabillaud croûte pistaches",  type:"plat",    allergens:["Poissons","Fruits à coque","Lait"] },
  { id:"dp3", name:"Agneau de lait rôti aux herbes",     type:"plat",    allergens:[] },
  { id:"dp4", name:"Risotto aux truffes noires",         type:"plat",    allergens:["Lait","Gluten"] },
  { id:"dd1", name:"Bûche marrons & chocolat noir",      type:"dessert", allergens:["Gluten","Œufs","Lait","Fruits à coque"] },
  { id:"dd2", name:"Millefeuille vanille-framboise",     type:"dessert", allergens:["Gluten","Œufs","Lait"] },
  { id:"dd3", name:"Charlotte aux fraises",              type:"dessert", allergens:["Gluten","Œufs","Lait"] },
  { id:"dd4", name:"Tarte citron meringuée",             type:"dessert", allergens:["Gluten","Œufs","Lait"] },
];
const INIT_MENUS: MenuData[] = [
  { id:"m1", title:"Formule Noël Prestige", images:["https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format","https://images.unsplash.com/photo-1778850790390-c1ba244fbc85?w=800&h=560&fit=crop&auto=format"], description:"Notre formule emblématique des fêtes de fin d'année. Du velouté réconfortant à la bûche maison — un Noël complet sans effort.", theme:"Noël", dishIds:["de1","dp1","dd1"], minPeople:4, price:148, conditions:"Commander au minimum 5 jours avant. Livraison le 24 décembre en matinée uniquement. Annulation moins de 48 h : acompte conservé.", regime:"classique", stock:8, active:true, minOrderDays:5, storage:"Conserver entre 0 °C et 4 °C. Consommer dans les 24 h suivant la livraison. Ne pas recongeler." },
  { id:"m2", title:"Formule Pâques Printanière", images:["https://images.unsplash.com/photo-1605926637512-c8b131444a4b?w=800&h=560&fit=crop&auto=format","https://images.unsplash.com/photo-1620791144170-8a443bf37a33?w=800&h=560&fit=crop&auto=format"], description:"Célébrez le printemps avec légèreté. Asperges de saison, agneau de lait et charlotte aux fraises.", theme:"Pâques", dishIds:["de3","dp3","dd3"], minPeople:4, price:136, conditions:"Commande minimum 7 jours avant. Disponible du Vendredi Saint au Lundi de Pâques. Acompte 30 % à la commande.", regime:"classique", stock:5, active:true, minOrderDays:7, storage:"Conserver entre 0 °C et 4 °C. La charlotte aux fraises est à consommer le jour même. Agneau à réchauffer à 160 °C — 15 min sous papier aluminium." },
  { id:"m3", title:"Menu Gastronomique Classique", images:["https://images.unsplash.com/photo-1577303935007-0d306ee638cf?w=800&h=560&fit=crop&auto=format","https://images.unsplash.com/photo-1740594967618-23cd757b9291?w=800&h=560&fit=crop&auto=format"], description:"Pour anniversaires, retraites, dîners d'affaires. Un menu tout en finesse autour du meilleur de la cuisine bordelaise.", theme:"classique", dishIds:["de2","dp2","dd2"], minPeople:6, price:198, conditions:"Réservation minimum 10 jours avant. Service lundi–samedi. Livraison dans un rayon de 50 km autour de Bordeaux.", regime:"classique", stock:12, active:true, minOrderDays:10, storage:"Conserver entre 0 °C et 4 °C. Consommer dans les 48 h. Le millefeuille doit être conservé à plat, sans superposition. Réchauffer les plats chauds à 165 °C à cœur minimum." },
  { id:"m4", title:"Menu Végétarien Truffe & Saison", images:["https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=800&h=560&fit=crop&auto=format","https://images.unsplash.com/photo-1578861256505-d3be7cb037d3?w=800&h=560&fit=crop&auto=format"], description:"Un menu raffiné sans viande ni poisson. Risotto aux truffes noires et tarte citron revisitée.", theme:"événement", dishIds:["de1","dp4","dd4"], minPeople:4, price:124, conditions:"Commande 5 jours avant. Risotto soumis à disponibilité saisonnière (nov–mars). 100 % végétarien garanti.", regime:"végétarien", stock:3, active:true, minOrderDays:5, storage:"Conserver entre 0 °C et 4 °C. Le risotto se déguste le jour même pour conserver sa texture. Réchauffer doucement à feu doux en ajoutant un filet d'eau." },
  { id:"m5", title:"Soirée Prestige Saint-Jacques", images:["https://images.unsplash.com/photo-1605926637512-c8b131444a4b?w=800&h=560&fit=crop&auto=format","https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format"], description:"Notre menu haut de gamme pour les grandes célébrations. Carpaccio de saint-jacques, magret aux cèpes, bûche signature.", theme:"événement", dishIds:["de4","dp1","dd1"], minPeople:8, price:320, conditions:"Délai minimum 14 jours impératif. Service inclus. Acompte de 30 % obligatoire. Solde dû à la livraison.", regime:"classique", stock:2, active:true, minOrderDays:14, storage:"Conserver entre 0 °C et 4 °C. Le carpaccio de saint-jacques se consomme impérativement le jour même. La bûche se conserve 48 h au réfrigérateur. Ne jamais laisser à température ambiante plus de 2 h." },
];
function mh(statuses: OrderStatus[], base: string): StatusEntry[] {
  return statuses.map((status,i) => ({ status, at: new Date(new Date(base).getTime()+i*3*3600000).toISOString() }));
}
const INIT_ORDERS: Order[] = [
  { id:"ord1", userEmail:"user@exemple.fr", menuId:"m1", menuTitle:"Formule Noël Prestige", menuImage:"https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=200&h=200&fit=crop&auto=format", menuMinPeople:4, firstName:"Marie", lastName:"Dupont", email:"user@exemple.fr", phone:"0698765432", eventDate:"2026-12-24", deliveryTime:"11:00", address:"3 place de la Victoire", city:"Bordeaux", inBordeaux:true, distanceKm:0, people:9, menuSubtotal:333, deliveryFee:0, discount:33.3, total:299.7, notes:"Allergie noix enfant.", statusHistory:mh(["en attente","accepté","en préparation"],"2026-11-15T10:30:00"), currentStatus:"en préparation" },
  { id:"ord2", userEmail:"user@exemple.fr", menuId:"m4", menuTitle:"Menu Végétarien Truffe & Saison", menuImage:"https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=200&h=200&fit=crop&auto=format", menuMinPeople:4, firstName:"Marie", lastName:"Dupont", email:"user@exemple.fr", phone:"0698765432", eventDate:"2026-10-18", deliveryTime:"19:30", address:"12 rue du Médoc", city:"Mérignac", inBordeaux:false, distanceKm:8, people:4, menuSubtotal:124, deliveryFee:9.72, discount:0, total:133.72, notes:"", statusHistory:mh(["en attente","accepté","en préparation","en cours de livraison","livré","terminée"],"2026-10-12T09:00:00"), currentStatus:"terminée", review:{ rating:5, comment:"Excellent ! Truffes parfaites, livraison ponctuelle.", at:"2026-10-19T10:15:00", validated:true } },
  { id:"ord3", userEmail:"user@exemple.fr", menuId:"m3", menuTitle:"Menu Gastronomique Classique", menuImage:"https://images.unsplash.com/photo-1577303935007-0d306ee638cf?w=200&h=200&fit=crop&auto=format", menuMinPeople:6, firstName:"Marie", lastName:"Dupont", email:"user@exemple.fr", phone:"0698765432", eventDate:"2026-09-14", deliveryTime:"12:00", address:"5 avenue de la Gare", city:"Pessac", inBordeaux:false, distanceKm:12, people:6, menuSubtotal:198, deliveryFee:12.08, discount:0, total:210.08, notes:"", statusHistory:mh(["en attente","annulée"],"2026-09-05T14:00:00"), currentStatus:"annulée", cancellationContactMode:"Téléphone", cancellationReason:"Indisponibilité de la date demandée." },
  { id:"ord4", userEmail:"user@exemple.fr", menuId:"m5", menuTitle:"Soirée Prestige Saint-Jacques", menuImage:"https://images.unsplash.com/photo-1605926637512-c8b131444a4b?w=200&h=200&fit=crop&auto=format", menuMinPeople:8, firstName:"Marie", lastName:"Dupont", email:"user@exemple.fr", phone:"0698765432", eventDate:"2026-11-02", deliveryTime:"20:00", address:"18 cours de l'Intendance", city:"Bordeaux", inBordeaux:true, distanceKm:0, people:10, menuSubtotal:400, deliveryFee:0, discount:40, total:360, notes:"Tables rondes.", statusHistory:mh(["en attente","accepté","en préparation","en cours de livraison","livré","en attente du retour de matériel"],"2026-10-25T09:00:00"), currentStatus:"en attente du retour de matériel", hasEquipmentLoan:true, review:{ rating:4, comment:"Très bonne soirée, service impeccable.", at:"2026-11-05T11:00:00", validated:undefined } },
  { id:"ord5", userEmail:"user@exemple.fr", menuId:"m1", menuTitle:"Formule Noël Prestige", menuImage:"https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=200&h=200&fit=crop&auto=format", menuMinPeople:4, firstName:"Thomas", lastName:"Bernard", email:"thomas@exemple.fr", phone:"0612000001", eventDate:"2026-12-23", deliveryTime:"10:00", address:"7 rue Sainte-Catherine", city:"Bordeaux", inBordeaux:true, distanceKm:0, people:4, menuSubtotal:148, deliveryFee:0, discount:0, total:148, notes:"", statusHistory:mh(["en attente"],"2026-11-20T08:00:00"), currentStatus:"en attente" },
  { id:"ord6", userEmail:"user@exemple.fr", menuId:"m2", menuTitle:"Formule Pâques Printanière", menuImage:"https://images.unsplash.com/photo-1605926637512-c8b131444a4b?w=200&h=200&fit=crop&auto=format", menuMinPeople:4, firstName:"Sophie", lastName:"Leroy", email:"sophie@exemple.fr", phone:"0612000002", eventDate:"2026-04-20", deliveryTime:"13:00", address:"2 place du Parlement", city:"Bordeaux", inBordeaux:true, distanceKm:0, people:6, menuSubtotal:204, deliveryFee:0, discount:0, total:204, notes:"", statusHistory:mh(["en attente","accepté","en préparation","en cours de livraison","livré","terminée"],"2026-04-14T10:00:00"), currentStatus:"terminée", review:{ rating:4, comment:"Menu printanier délicat, l'agneau était fondant.", at:"2026-04-21T09:00:00", validated:true } },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (p: number) => Number(p).toFixed(2).replace(".", ",") + " €";
const uid = () => "x" + Math.random().toString(36).slice(2, 8);
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}); } catch { return iso; } };
const fmtDateShort = (iso: string) => { try { return new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}); } catch { return iso; } };
const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}); } catch { return iso; } };

function calcDeliveryFee(inBordeaux: boolean, km: number) { return inBordeaux ? 0 : 5 + 0.59 * km; }
function calcDiscount(sub: number, minP: number, people: number) { return people >= minP + 5 ? sub * 0.1 : 0; }
function validatePassword(pw: string): string[] {
  const e: string[] = [];
  if (pw.length < 10) e.push("10 caractères minimum");
  if (!/[A-Z]/.test(pw)) e.push("une majuscule");
  if (!/[a-z]/.test(pw)) e.push("une minuscule");
  if (!/[0-9]/.test(pw)) e.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("un caractère spécial");
  return e;
}

function getDisabledEmails(): string[] { return JSON.parse(localStorage.getItem("vg_disabled") || "[]"); }
function setDisabledEmails(list: string[]) { localStorage.setItem("vg_disabled", JSON.stringify(list)); }
function allUsers(): RegisteredUser[] { return [...SEED_USERS, ...JSON.parse(sessionStorage.getItem("vg_users") || "[]")]; }

function nextStatus(current: OrderStatus, hasEquipment: boolean): OrderStatus | null {
  const map: Partial<Record<OrderStatus,OrderStatus>> = {
    "en attente":"accepté","accepté":"en préparation","en préparation":"en cours de livraison","en cours de livraison":"livré",
    "en attente du retour de matériel":"terminée",
  };
  if (current === "livré") return hasEquipment ? "en attente du retour de matériel" : "terminée";
  return map[current] ?? null;
}

// ── Cart Drawer ────────────────────────────────────────────────────────────────

function CartDrawer({ cart, onClose, onInc, onDec }: { cart:CartItem[]; onClose:()=>void; onInc:(id:string)=>void; onDec:(id:string)=>void }) {
  const [done, setDone] = useState(false);
  const total = cart.reduce((s,c)=>s+c.menu.price*c.qty,0);
  const trapRef = useFocusTrap(true);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Votre panier">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <aside ref={trapRef} className="relative w-full max-w-md bg-card h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0"><h2 className="text-xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Votre panier</h2><button onClick={onClose} aria-label="Fermer le panier" className="text-muted-foreground hover:text-foreground"><X size={20} aria-hidden="true"/></button></div>
        {cart.length===0 ? <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6"><ShoppingCart size={40} strokeWidth={1} aria-hidden="true"/><p className="text-sm">Votre panier est vide.</p></div> : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-border px-6" aria-label="Articles dans le panier">{cart.map(({menu,qty})=><li key={menu.id} className="py-4 flex items-start gap-4"><img src={(menu.images?.[0] || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format')} alt="" className="w-14 h-14 object-cover flex-shrink-0 bg-muted" aria-hidden="true"/><div className="flex-1 min-w-0"><p className="font-medium text-sm" style={{fontFamily:"'Playfair Display',serif"}}>{menu.title}</p><p className="text-xs text-muted-foreground mt-0.5">{fmt(menu.price)} · {(menu.minPeople || menu.min_people || 4)} pers. min</p><div className="flex items-center gap-2 mt-2" role="group" aria-label={`Quantité pour ${menu.title}`}><button onClick={()=>onDec(menu.id)} aria-label="Retirer un exemplaire" className="w-6 h-6 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={12} aria-hidden="true"/></button><span className="text-sm w-4 text-center" aria-live="polite">{qty}</span><button onClick={()=>onInc(menu.id)} aria-label="Ajouter un exemplaire" className="w-6 h-6 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={12} aria-hidden="true"/></button></div></div><p className="text-sm font-semibold text-primary flex-shrink-0" style={{fontFamily:"'Playfair Display',serif"}}>{fmt(menu.price*qty)}</p></li>)}</ul>
            <div className="px-6 py-5 border-t border-border space-y-4 flex-shrink-0"><div className="flex justify-between text-base font-semibold" style={{fontFamily:"'Playfair Display',serif"}}><span>Total</span><span className="text-primary" aria-live="polite">{fmt(total)}</span></div>{done?<div role="status" className="text-center py-3 bg-secondary text-sm"><Check size={16} className="inline mr-2 text-accent" aria-hidden="true"/>Demande reçue — nous vous recontactons sous 24 h.</div>:<button onClick={()=>setDone(true)} className="w-full py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Confirmer</button>}</div>
          </>
        )}
      </aside>
    </div>
  );
}

// ── Cancel Order Modal ─────────────────────────────────────────────────────────

function CancelOrderModal({ order, onClose, onConfirm }: { order:Order; onClose:()=>void; onConfirm:(contactMode:string,reason:string)=>void }) {
  const [contactMode, setContactMode] = useState<"Téléphone"|"E-mail"|"">("");
  const [reason, setReason] = useState("");
  const trapRef = useFocusTrap(true);
  const ic = "bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Annuler la commande">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-lg mx-4 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-red-700" style={{fontFamily:"'Playfair Display',serif"}}>Annuler la commande</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 space-y-1.5" role="note">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle size={15} aria-hidden="true"/>Obligation de contact préalable</p>
          <p>Vous devez avoir contacté <strong>{order.firstName} {order.lastName}</strong> avant d&apos;annuler cette commande.</p>
        </div>
        <fieldset className="space-y-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Mode de contact utilisé *</legend><div className="flex gap-3 mt-2">{(["Téléphone","E-mail"] as const).map(m=><label key={m} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border cursor-pointer text-sm transition-colors ${contactMode===m?"border-primary bg-primary/5 text-primary":"border-border hover:border-primary/50"}`}><input type="radio" name="contact" value={m} checked={contactMode===m} onChange={()=>setContactMode(m)} className="sr-only"/>{m==="Téléphone"?<Phone size={14} aria-hidden="true"/>:<Mail size={14} aria-hidden="true"/>}{m}</label>)}</div></fieldset>
        <div className="flex flex-col gap-1.5"><label htmlFor="cancel-reason" className="text-xs tracking-widest uppercase text-muted-foreground">Motif de l&apos;annulation *</label><textarea id="cancel-reason" rows={3} value={reason} onChange={e=>setReason(e.target.value)} className={ic+" resize-none"} placeholder="Ex : Date indisponible, cuisine fermée ce jour..." aria-required="true"/></div>
        <div className="flex gap-3 pt-1">
          <button disabled={!contactMode||!reason.trim()} onClick={()=>onConfirm(contactMode,reason)} className="flex-1 py-2.5 bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2"><Ban size={14} aria-hidden="true"/>Confirmer l&apos;annulation</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Retour</button>
        </div>
      </div>
    </div>
  );
}

// ── Advance Status Modal ───────────────────────────────────────────────────────

function AdvanceStatusModal({ order, onClose, onConfirm }: { order:Order; onClose:()=>void; onConfirm:(next:OrderStatus,hasEquipment?:boolean)=>void }) {
  const [equipChoice, setEquipChoice] = useState<"none"|"equipment">("none");
  const isAfterLivred = order.currentStatus==="livré";
  const trapRef = useFocusTrap(true);
  const next = isAfterLivred ? (equipChoice==="equipment"?"en attente du retour de matériel":"terminée") : nextStatus(order.currentStatus,false);
  if (!next && !isAfterLivred) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Avancer le statut de la commande">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-md mx-4 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Avancer le statut</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="bg-secondary border border-border p-4 text-sm space-y-1">
          <p className="text-muted-foreground">Commande : <strong className="text-foreground">{order.firstName} {order.lastName}</strong></p>
          <p className="text-muted-foreground">Statut actuel : <StatusBadge status={order.currentStatus}/></p>
        </div>
        {isAfterLivred ? (
          <fieldset className="space-y-3"><legend className="text-sm text-muted-foreground">Du matériel a-t-il été prêté au client ?</legend>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className={`flex flex-col items-center gap-2 p-4 border cursor-pointer text-sm transition-colors ${equipChoice==="none"?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}><input type="radio" name="equip" value="none" checked={equipChoice==="none"} onChange={()=>setEquipChoice("none")} className="sr-only"/><Check size={20} className={equipChoice==="none"?"text-primary":"text-border"} aria-hidden="true"/><span>Sans prêt</span><span className="text-xs text-muted-foreground text-center">→ Terminée</span></label>
              <label className={`flex flex-col items-center gap-2 p-4 border cursor-pointer text-sm transition-colors ${equipChoice==="equipment"?"border-rose-500 bg-rose-50":"border-border hover:border-rose-300"}`}><input type="radio" name="equip" value="equipment" checked={equipChoice==="equipment"} onChange={()=>setEquipChoice("equipment")} className="sr-only"/><Box size={20} className={equipChoice==="equipment"?"text-rose-600":"text-border"} aria-hidden="true"/><span>Avec prêt</span><span className="text-xs text-muted-foreground text-center">→ Retour matériel</span></label>
            </div>
            {equipChoice==="equipment" && <div className="bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 leading-relaxed" role="note"><strong>Notification automatique :</strong> Le client recevra un e-mail l&apos;informant du délai de <strong>10 jours ouvrés</strong> pour restituer le matériel, faute de quoi <strong>600 € TTC</strong> lui seront facturés (CGV).</div>}
          </fieldset>
        ) : (
          <p className="text-sm text-muted-foreground">Prochain statut : <strong className="text-foreground ml-1"><StatusBadge status={next!}/></strong></p>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={()=>onConfirm(isAfterLivred?(equipChoice==="equipment"?"en attente du retour de matériel":"terminée"):next!,equipChoice==="equipment")} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center justify-center gap-2"><CR size={14} aria-hidden="true"/>Confirmer l&apos;avancement</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ── Menu Detail ────────────────────────────────────────────────────────────────

function MenuDetailView({ menu, dishes, user, onBack, onOrder, onAuth }: { menu:MenuData; dishes:Dish[]; user:AuthUser|null; onBack:()=>void; onOrder:()=>void; onAuth:()=>void }) {
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

// ── Order View ─────────────────────────────────────────────────────────────────

function OrderView({ menu, user, onBack, onConfirm }: { menu:MenuData; user:AuthUser; onBack:()=>void; onConfirm:(order:Order)=>void }) {
  const [step, setStep] = useState(1);
  const np=user.name.split(" ");
  const [s1,setS1]=useState({ firstName:np[0]||"",lastName:np.slice(1).join(" ")||"",email:user.email,phone:user.phone||"",eventDate:"",deliveryTime:"12:00",address:user.address?.split(",")[0]?.trim()||"",city:"Bordeaux",inBordeaux:true,distanceKm:"0",notes:"" });
  const [people,setPeople]=useState((menu.minPeople || menu.min_people || 4));
  const [agreed,setAgreed]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const menuSub=+((menu.price/(menu.minPeople || menu.min_people || 4))*people).toFixed(2);
  const discount=+(calcDiscount(menuSub,(menu.minPeople || menu.min_people || 4),people)).toFixed(2);
  const delivFee=+(calcDeliveryFee(s1.inBordeaux,+s1.distanceKm||0)).toFixed(2);
  const total=+(menuSub-discount+delivFee).toFixed(2);
  const hasDiscount=people>=(menu.minPeople || menu.min_people || 4)+5;
  const ic="bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const steps=["Livraison","Menu & personnes","Récapitulatif"];

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (menu.minOrderDays || 5) + 3);
    return d.toISOString().split("T")[0];
  }, [menu.minOrderDays]);

  const tooFar = !s1.inBordeaux && +s1.distanceKm >= 50;

  async function handleConfirm(e:React.FormEvent){
    e.preventDefault(); if(!agreed)return;
    const order:Order={ id:uid(),userEmail:user.email,menuId:menu.id,menuTitle:menu.title,menuImage:(menu.images?.[0] || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format'),menuMinPeople:(menu.minPeople || menu.min_people || 4),firstName:s1.firstName,lastName:s1.lastName,email:s1.email,phone:s1.phone,eventDate:s1.eventDate,deliveryTime:s1.deliveryTime,address:s1.address,city:s1.city,inBordeaux:s1.inBordeaux,distanceKm:+s1.distanceKm||0,people,menuSubtotal:menuSub,deliveryFee:delivFee,discount,total,notes:s1.notes,statusHistory:[{status:"en attente",at:new Date().toISOString()}],currentStatus:"en attente" };
    try {
      await createOrder({ menuId:menu.id,firstName:s1.firstName,lastName:s1.lastName,email:s1.email,phone:s1.phone,eventDate:s1.eventDate,deliveryTime:s1.deliveryTime,address:s1.address,city:s1.city,inBordeaux:s1.inBordeaux,distanceKm:+s1.distanceKm||0,people,menuSubtotal:menuSub,deliveryFee:delivFee,discount,total,notes:s1.notes });
    } catch(err) { console.error(err); }
    onConfirm(order);
    setConfirmed(true);
  }

  if(confirmed) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6" role="status" aria-live="polite">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CircleCheck size={32} className="text-emerald-600" aria-hidden="true"/></div>
      <h2 className="text-3xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Commande confirmée !</h2>
      <p className="text-muted-foreground leading-relaxed">Merci {s1.firstName} ! Votre commande pour <strong>{menu.title}</strong> le <strong>{fmtDate(s1.eventDate)}</strong> est enregistrée. Un e-mail de confirmation a été envoyé à <strong>{s1.email}</strong>.</p>
      <div className="bg-secondary border border-border p-5 text-left text-sm space-y-2"><p><strong>Menu :</strong> {menu.title}</p><p><strong>Date :</strong> {fmtDate(s1.eventDate)} à {s1.deliveryTime}</p><p><strong>Livraison :</strong> {s1.address}, {s1.city}</p><p><strong>Personnes :</strong> {people}</p><p><strong>Total :</strong> {fmt(total)}</p></div>
      <button onClick={onBack} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90">Voir mes commandes</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft size={14} aria-hidden="true"/>Retour</button>
      <p className="text-xs tracking-widest uppercase text-accent mb-2">Commande</p>
      <h1 className="text-3xl font-semibold mb-8" style={{fontFamily:"'Playfair Display',serif"}}>Commander un menu</h1>
      <ol className="flex items-center mb-10" aria-label="Étapes de la commande">
        {steps.map((s,i)=>(
          <li key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step>i+1?"bg-accent text-accent-foreground":step===i+1?"bg-primary text-primary-foreground":"bg-secondary text-muted-foreground"}`} aria-current={step===i+1?"step":undefined}>{step>i+1?<Check size={14} aria-hidden="true"/>:i+1}</div><p className={`text-[10px] mt-1 uppercase tracking-wider whitespace-nowrap ${step===i+1?"text-foreground":"text-muted-foreground"}`}>{s}</p></div>
            {i<steps.length-1&&<div className={`flex-1 h-px mx-2 mb-5 transition-colors ${step>i+1?"bg-accent":"bg-border"}`} aria-hidden="true"/>}
          </li>
        ))}
      </ol>

      {step===1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Informations de livraison</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="o-fn" className="text-xs tracking-widest uppercase text-muted-foreground">Prénom *</label><input id="o-fn" required value={s1.firstName} onChange={e=>setS1(f=>({...f,firstName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-ln" className="text-xs tracking-widest uppercase text-muted-foreground">Nom *</label><input id="o-ln" required value={s1.lastName} onChange={e=>setS1(f=>({...f,lastName:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-email" className="text-xs tracking-widest uppercase text-muted-foreground">E-mail *</label><input id="o-email" type="email" required value={s1.email} onChange={e=>setS1(f=>({...f,email:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-phone" className="text-xs tracking-widest uppercase text-muted-foreground">Téléphone *</label><input id="o-phone" type="tel" required value={s1.phone} onChange={e=>setS1(f=>({...f,phone:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-date" className="text-xs tracking-widest uppercase text-muted-foreground">Date de la prestation *</label><input id="o-date" type="date" required min={minDate} value={s1.eventDate} onChange={e=>setS1(f=>({...f,eventDate:e.target.value}))} className={ic}/><p className="text-[11px] text-muted-foreground">Date au plus tôt : <strong>{fmtDate(minDate)}</strong> (délai minimum {menu.minOrderDays + 3} jours)</p></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-time" className="text-xs tracking-widest uppercase text-muted-foreground">Heure de livraison *</label><input id="o-time" type="time" required value={s1.deliveryTime} onChange={e=>setS1(f=>({...f,deliveryTime:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse de livraison *</label><input id="o-addr" required value={s1.address} onChange={e=>setS1(f=>({...f,address:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="o-city" className="text-xs tracking-widest uppercase text-muted-foreground">Ville *</label><input id="o-city" required value={s1.city} onChange={e=>setS1(f=>({...f,city:e.target.value}))} className={ic}/></div>
            <fieldset className="flex flex-col gap-1.5 justify-end"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Livraison à Bordeaux ?</legend><div className="flex gap-4 pt-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="bordeaux" checked={s1.inBordeaux} onChange={()=>setS1(f=>({...f,inBordeaux:true,distanceKm:"0"}))}/>Oui</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="bordeaux" checked={!s1.inBordeaux} onChange={()=>setS1(f=>({...f,inBordeaux:false}))}/>Non</label></div></fieldset>
            {!s1.inBordeaux&&<div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-km" className="text-xs tracking-widest uppercase text-muted-foreground">Distance depuis Bordeaux (km) *</label><input id="o-km" type="number" min={1} max={499} required value={s1.distanceKm} onChange={e=>setS1(f=>({...f,distanceKm:e.target.value}))} className={ic}/>{tooFar?<div className="flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 text-sm" role="alert"><AlertTriangle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true"/><p>La livraison n&apos;est pas disponible au-delà de 50 km. <a href="#contact" onClick={e=>{e.preventDefault();}} className="underline font-medium">Contactez-nous</a> pour un devis personnalisé de votre événement.</p></div>:<p className="text-[11px] text-muted-foreground" aria-live="polite"><Truck size={11} className="inline mr-1" aria-hidden="true"/>Frais de livraison estimés : <strong>{fmt(calcDeliveryFee(false,+s1.distanceKm||0))}</strong></p>}</div>}
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="o-notes" className="text-xs tracking-widest uppercase text-muted-foreground">Demandes particulières</label><textarea id="o-notes" rows={2} value={s1.notes} onChange={e=>setS1(f=>({...f,notes:e.target.value}))} className={ic+" resize-none"} placeholder="Allergie, accès livraison..."/></div>
          </div>
          <div className="flex justify-end pt-2"><button onClick={()=>{ if(!s1.firstName||!s1.lastName||!s1.email||!s1.phone||!s1.eventDate||!s1.address||tooFar)return; setStep(2); }} disabled={tooFar} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">Étape suivante <CR size={14} aria-hidden="true"/></button></div>
        </div>
      )}
      {step===2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Votre menu &amp; nombre de personnes</h2>
          <div className="bg-card border border-border p-5 flex gap-4"><img src={(menu.images?.[0] || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format')} alt="" className="w-20 h-20 object-cover flex-shrink-0 bg-muted" aria-hidden="true"/><div><p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">Menu sélectionné</p><h3 className="font-semibold text-lg" style={{fontFamily:"'Playfair Display',serif"}}>{menu.title}</h3><p className="text-sm text-muted-foreground mt-1">{fmt(menu.price)} pour {(menu.minPeople || menu.min_people || 4)} personnes</p></div></div>
          <div className="flex flex-col gap-2"><label className="text-xs tracking-widest uppercase text-muted-foreground" id="people-label">Nombre de personnes *</label><div className="flex items-center gap-4" role="group" aria-labelledby="people-label"><button type="button" onClick={()=>setPeople(p=>Math.max((menu.minPeople || menu.min_people || 4),p-1))} aria-label="Retirer une personne" className="w-10 h-10 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={16} aria-hidden="true"/></button><span className="text-3xl font-semibold w-12 text-center" aria-live="polite" aria-atomic="true" style={{fontFamily:"'Playfair Display',serif"}}>{people}</span><button type="button" onClick={()=>setPeople(p=>p+1)} aria-label="Ajouter une personne" className="w-10 h-10 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={16} aria-hidden="true"/></button></div><p className="text-xs text-muted-foreground">Minimum : {(menu.minPeople || menu.min_people || 4)} personnes</p>{hasDiscount&&<p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5" role="status"><CircleCheck size={14} aria-hidden="true"/>Remise de 10 % appliquée !</p>}</div>
          <div className="bg-secondary border border-border p-5 space-y-2" aria-live="polite" aria-atomic="true">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Estimation en temps réel</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Menu × {people} personnes</span><span>{fmt(menuSub)}</span></div>
            {hasDiscount&&<div className="flex justify-between text-sm text-emerald-700"><span>Remise 10 %</span><span>−{fmt(discount)}</span></div>}
            {!s1.inBordeaux&&<div className="flex justify-between text-sm text-muted-foreground"><span>Livraison</span><span>{fmt(delivFee)}</span></div>}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border" style={{fontFamily:"'Playfair Display',serif"}}><span>Total estimé</span><span className="text-primary">{fmt(total)}</span></div>
          </div>
          <div className="flex justify-between pt-2"><button onClick={()=>setStep(1)} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary flex items-center gap-2"><ArrowLeft size={14} aria-hidden="true"/>Retour</button><button onClick={()=>setStep(3)} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 flex items-center gap-2">Récapitulatif <CR size={14} aria-hidden="true"/></button></div>
        </div>
      )}
      {step===3 && (
        <form onSubmit={handleConfirm} className="space-y-6" noValidate>
          <h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Récapitulatif &amp; confirmation</h2>
          <dl className="bg-card border border-border divide-y divide-border text-sm">
            {[["Client",`${s1.firstName} ${s1.lastName}`],["E-mail",s1.email],["Téléphone",s1.phone],["Menu",menu.title],["Date",`${s1.eventDate?fmtDate(s1.eventDate):"—"} à ${s1.deliveryTime}`],["Livraison",`${s1.address}, ${s1.city}`],["Personnes",String(people)]].map(([k,v])=><div key={k} className="px-5 py-3 flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <div className="bg-secondary border border-border p-5 space-y-2 text-sm">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Détail du prix</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix menu × {people} personnes</span><span>{fmt(menuSub)}</span></div>
            {hasDiscount&&<div className="flex justify-between text-emerald-700"><span>Remise 10 %</span><span>−{fmt(discount)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Frais de livraison</span><span>{s1.inBordeaux?"Inclus":fmt(delivFee)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border" style={{fontFamily:"'Playfair Display',serif"}}><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
          </div>
          <div className="border-2 border-primary bg-primary/5 p-4 flex gap-3" role="note"><Info size={15} className="text-primary flex-shrink-0 mt-0.5" aria-hidden="true"/><div><p className="text-sm font-semibold text-primary mb-1">Conditions du menu</p><p className="text-sm text-muted-foreground leading-relaxed">{menu.conditions}</p></div></div>
          <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 accent-primary flex-shrink-0"/><span className="text-sm text-muted-foreground leading-relaxed">J&apos;ai lu et j&apos;accepte les <strong className="text-foreground">conditions du menu</strong> ainsi que les <strong className="text-foreground">CGV</strong>.</span></label>
          <div className="flex justify-between pt-2"><button type="button" onClick={()=>setStep(2)} className="px-6 py-2.5 border border-border text-sm hover:bg-secondary flex items-center gap-2"><ArrowLeft size={14} aria-hidden="true"/>Retour</button><button type="submit" disabled={!agreed} className="px-8 py-3 bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-2"><Check size={16} aria-hidden="true"/>Confirmer la commande</button></div>
        </form>
      )}
    </div>
  );
}

// ── Order Modify Modal ─────────────────────────────────────────────────────────

function OrderModifyModal({ order, onClose, onSave }: { order:Order; onClose:()=>void; onSave:(partial:Partial<Order>)=>void }) {
  const [f,setF]=useState({ eventDate:order.eventDate,deliveryTime:order.deliveryTime,address:order.address,city:order.city,notes:order.notes,people:order.people,inBordeaux:order.inBordeaux,distanceKm:String(order.distanceKm) });
  const ic="w-full bg-input-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const trapRef=useFocusTrap(true);
  function handleSave(){ const ppp=order.menuSubtotal/order.people; const sub=+(ppp*f.people).toFixed(2); const disc=+(calcDiscount(sub,order.menuMinPeople,f.people)).toFixed(2); const fee=+(calcDeliveryFee(f.inBordeaux,+f.distanceKm||0)).toFixed(2); onSave({ eventDate:f.eventDate,deliveryTime:f.deliveryTime,address:f.address,city:f.city,notes:f.notes,people:f.people,inBordeaux:f.inBordeaux,distanceKm:+f.distanceKm||0,menuSubtotal:sub,discount:disc,deliveryFee:fee,total:+(sub-disc+fee).toFixed(2) }); onClose(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Modifier la commande">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div ref={trapRef} className="relative bg-card border border-border w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0"><h2 className="text-lg font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Modifier la commande</h2><button onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true"/></button></div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="bg-secondary border border-border p-3 text-xs text-muted-foreground flex items-center gap-2"><Info size={12} aria-hidden="true"/>Le choix du menu ne peut pas être modifié.</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-date" className="text-xs tracking-widest uppercase text-muted-foreground">Date</label><input id="mod-date" type="date" value={f.eventDate} onChange={e=>setF(x=>({...x,eventDate:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-time" className="text-xs tracking-widest uppercase text-muted-foreground">Heure</label><input id="mod-time" type="time" value={f.deliveryTime} onChange={e=>setF(x=>({...x,deliveryTime:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-addr" className="text-xs tracking-widest uppercase text-muted-foreground">Adresse</label><input id="mod-addr" value={f.address} onChange={e=>setF(x=>({...x,address:e.target.value}))} className={ic}/></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="mod-city" className="text-xs tracking-widest uppercase text-muted-foreground">Ville</label><input id="mod-city" value={f.city} onChange={e=>setF(x=>({...x,city:e.target.value}))} className={ic}/></div>
            <fieldset className="flex flex-col gap-1.5 sm:col-span-2"><legend className="text-xs tracking-widest uppercase text-muted-foreground">Bordeaux ?</legend><div className="flex gap-4 mt-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="mod-bordeaux" checked={f.inBordeaux} onChange={()=>setF(x=>({...x,inBordeaux:true,distanceKm:"0"}))}/>Oui</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="mod-bordeaux" checked={!f.inBordeaux} onChange={()=>setF(x=>({...x,inBordeaux:false}))}/>Non</label></div></fieldset>
            {!f.inBordeaux&&<div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="mod-km" className="text-xs tracking-widest uppercase text-muted-foreground">Distance (km)</label><input id="mod-km" type="number" min={1} value={f.distanceKm} onChange={e=>setF(x=>({...x,distanceKm:e.target.value}))} className={ic}/></div>}
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label className="text-xs tracking-widest uppercase text-muted-foreground" id="mod-people-lbl">Personnes</label><div className="flex items-center gap-3" role="group" aria-labelledby="mod-people-lbl"><button type="button" onClick={()=>setF(x=>({...x,people:Math.max(order.menuMinPeople,x.people-1)}))} aria-label="Retirer une personne" className="w-9 h-9 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={13} aria-hidden="true"/></button><span className="text-xl font-semibold w-8 text-center" aria-live="polite">{f.people}</span><button type="button" onClick={()=>setF(x=>({...x,people:x.people+1}))} aria-label="Ajouter une personne" className="w-9 h-9 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={13} aria-hidden="true"/></button></div></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="mod-notes" className="text-xs tracking-widest uppercase text-muted-foreground">Notes</label><textarea id="mod-notes" rows={2} value={f.notes} onChange={e=>setF(x=>({...x,notes:e.target.value}))} className={ic+" resize-none"}/></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0"><button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm hover:opacity-90"><Check size={14} className="inline mr-1.5" aria-hidden="true"/>Enregistrer</button><button onClick={onClose} className="px-5 py-2.5 border border-border text-sm hover:bg-secondary">Annuler</button></div>
      </div>
    </div>
  );
}

// ── User Space ─────────────────────────────────────────────────────────────────

function UserSpaceView({ user, orders, setOrders }: { user:AuthUser; orders:Order[]; setOrders:React.Dispatch<React.SetStateAction<Order[]>> }) {
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

// ── Stats Tab (admin only) ─────────────────────────────────────────────────────

function StatsTab({ menus, orders }: { menus:MenuData[]; orders:Order[] }) {
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
  const totalCA = revenueOrders.reduce((s,o)=>s+o.total,0);

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

// ── Team Tab (admin only) ──────────────────────────────────────────────────────

function TeamTab() {
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

// ── Admin Panel ────────────────────────────────────────────────────────────────

const EMENU: Omit<MenuData,"id"> = { title:"", images:[], description:"", theme:"classique", dishIds:[], minPeople:4, price:0, conditions:"", regime:"classique", stock:10, active:true, minOrderDays:5, storage:"" };
const EDISH: Omit<Dish,"id"> = { name:"", type:"entrée", allergens:[] };

function AdminPanel({ menus, dishes, orders, hours, user, setMenus, setDishes, setOrders, setHours }: {
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

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [view,setView]=useState<View>("home");
  const [selId,setSelId]=useState<string|null>(null);
  const [ordMenuId,setOrdMenuId]=useState<string|null>(null);
  const [menus,setMenus]=useState<MenuData[]>(INIT_MENUS);
  const [dishes,setDishes]=useState<Dish[]>(INIT_DISHES);
  // Load real data from API
// Load real data from API
useEffect(() => {
  getMenus().then(data => {
    if (data.menus && data.menus.length > 0) {
      // Merge API data with static data to keep dishIds
      const enriched = data.menus.map((apiMenu: any) => {
        const staticMenu = INIT_MENUS.find(m => m.title === apiMenu.title);
        return staticMenu ? { ...staticMenu, ...apiMenu } : apiMenu;
      });
      setMenus(enriched);
    }
  }).catch(console.error);
}, []);
  const [orders,setOrders]=useState<Order[]>(INIT_ORDERS);
  const [hours,setHours]=useState<HourSlot[]>(HOURS_INIT);
  const [cart,setCart]=useState<CartItem[]>([]);
  const [cartOpen,setCartOpen]=useState(false);
  const [authOpen,setAuthOpen]=useState(false);
  const [authTab,setAuthTab]=useState<AuthTab>("login");
  const [user,setUser]=useState<AuthUser|null>(null);
  const [legal,setLegal]=useState<"mentions"|"cgv"|null>(null);
  const [mob,setMob]=useState(false);

  const totalItems=cart.reduce((s,c)=>s+c.qty,0);
  function nav(v:View){ setView(v); setMob(false); window.scrollTo({top:0,behavior:"smooth"}); }
  function incCart(id:string){ setCart(p=>p.map(c=>c.menu.id===id?{...c,qty:c.qty+1}:c)); }
  function decCart(id:string){ setCart(p=>p.map(c=>c.menu.id===id?{...c,qty:c.qty-1}:c).filter(c=>c.qty>0)); }
  function openAuth(tab:AuthTab="login"){ setAuthTab(tab); setAuthOpen(true); }

  const selMenu=selId?menus.find(m=>m.id===selId):null;
  const ordMenu=ordMenuId?menus.find(m=>m.id===ordMenuId):null;
  const featured=menus.filter(m=>m.active).slice(0,3);
  const validatedReviews=orders.filter(o=>o.review?.validated===true);
  const navLinks=[{label:"Accueil",action:()=>nav("home")},{label:"Tous les menus",action:()=>nav("menus")},{label:"Contact",action:()=>nav("contact")}];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{fontFamily:"'DM Sans',sans-serif"}}>
      {/* RGAA skip link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 z-[100] text-sm">Aller au contenu principal</a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border" role="banner">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <button onClick={()=>nav("home")} aria-label="Vite et Gourmand — retour à l'accueil" className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-primary" style={{fontFamily:"'Playfair Display',serif"}}>Vite &amp; Gourmand</span>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground hidden sm:block" aria-hidden="true">Traiteur — Bordeaux depuis 1999</span>
          </button>
          <nav className="hidden md:flex items-center gap-7" aria-label="Navigation principale">
            {navLinks.map(l=><button key={l.label} onClick={l.action} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</button>)}
            {user&&(user.role==="admin"||user.role==="employee")&&<button onClick={()=>nav("admin")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><Settings size={13} aria-hidden="true"/>{user.role==="admin"?"Admin":"Espace employé"}</button>}
          </nav>
          <div className="flex items-center gap-2">
            {user?(<div className="hidden md:flex items-center gap-3"><button onClick={()=>nav("user-space")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><UserCircle size={16} aria-hidden="true"/>{user.name.split(" ")[0]}</button><button onClick={()=>{ setUser(null); if(["admin","order","user-space"].includes(view)) nav("home"); }} aria-label="Se déconnecter" className="text-muted-foreground hover:text-foreground"><LogOut size={16} aria-hidden="true"/></button></div>)
            :<button onClick={()=>openAuth("login")} className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-border text-xs hover:bg-secondary transition-colors"><User size={13} aria-hidden="true"/>Connexion</button>}
            <button onClick={()=>setCartOpen(true)} aria-label={`Ouvrir le panier${totalItems>0?` (${totalItems} article${totalItems>1?"s":""})`:""}`} className="relative flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm hover:opacity-90">
              <ShoppingCart size={15} aria-hidden="true"/><span className="hidden sm:inline" aria-hidden="true">Panier</span>
              {totalItems>0&&<span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold" aria-hidden="true">{totalItems}</span>}
            </button>
            <button className="md:hidden" onClick={()=>setMob(v=>!v)} aria-label={mob?"Fermer le menu":"Ouvrir le menu"} aria-expanded={mob} aria-controls="mobile-nav">{mob?<X size={22} aria-hidden="true"/>:<MenuIcon size={22} aria-hidden="true"/>}</button>
          </div>
        </div>
        {mob&&(
          <nav id="mobile-nav" className="md:hidden border-t border-border bg-card px-6 py-4 flex flex-col gap-4" aria-label="Navigation mobile">
            {navLinks.map(l=><button key={l.label} onClick={l.action} className="text-left text-sm hover:text-primary">{l.label}</button>)}
            {user&&(user.role==="admin"||user.role==="employee")&&<button onClick={()=>nav("admin")} className="text-left text-sm hover:text-primary">{user.role==="admin"?"Administration":"Espace employé"}</button>}
            {user?(<><button onClick={()=>nav("user-space")} className="text-left text-sm hover:text-primary flex items-center gap-2"><UserCircle size={13} aria-hidden="true"/>Mon espace</button><button onClick={()=>{ setUser(null); setMob(false); if(["admin","order","user-space"].includes(view)) nav("home"); }} className="text-left text-sm text-muted-foreground flex items-center gap-2"><LogOut size={13} aria-hidden="true"/>Déconnexion</button></>)
            :<button onClick={()=>{ openAuth("login"); setMob(false); }} className="text-left text-sm text-muted-foreground flex items-center gap-2"><User size={13} aria-hidden="true"/>Connexion / Créer un compte</button>}
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {view==="home"&&(
          <>
            <section aria-labelledby="hero-heading">
              <div className="grid md:grid-cols-2 min-h-[88vh]">
                <div className="flex flex-col justify-center px-8 md:px-16 py-20 bg-background">
                  <p className="text-xs tracking-widest uppercase text-accent mb-4" aria-hidden="true">Traiteur à Bordeaux</p>
                  <h1 id="hero-heading" className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08]" style={{fontFamily:"'Playfair Display',serif"}}>La table<br/><em className="italic font-normal">qui fait</em><br/>l&apos;événement.</h1>
                  <p className="mt-6 max-w-sm text-muted-foreground leading-relaxed">Julie et José cuisinent pour vous depuis 25 ans. Des menus de saison, faits maison, pour chacune de vos occasions.</p>
                  <div className="flex flex-wrap gap-3 mt-10"><button onClick={()=>nav("menus")} className="px-6 py-3 bg-primary text-primary-foreground text-sm tracking-wide hover:opacity-90">Voir tous les menus</button><button onClick={()=>nav("contact")} className="px-6 py-3 border border-primary text-primary text-sm hover:bg-primary hover:text-primary-foreground transition-colors">Nous contacter</button></div>
                  <div className="flex gap-8 mt-14 pt-8 border-t border-border">{[["25 ans","d'expérience"],["100 %","fait maison"],["50 km","autour de Bordeaux"]].map(([v,l])=><div key={v}><p className="text-2xl font-semibold text-primary" style={{fontFamily:"'Playfair Display',serif"}}>{v}</p><p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{l}</p></div>)}</div>
                </div>
                <div className="relative h-72 md:h-auto bg-muted"><img src="https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=900&h=1100&fit=crop&auto=format" alt="Table dressée avec élégance pour un repas festif" className="w-full h-full object-cover"/><div className="absolute bottom-8 left-8 bg-card/95 backdrop-blur p-4 border border-border max-w-[200px]" aria-hidden="true"><p className="text-xs tracking-widest uppercase text-muted-foreground">Menu du moment</p><p className="text-sm font-semibold mt-1 leading-snug" style={{fontFamily:"'Playfair Display',serif"}}>Formule Noël 2026</p><p className="text-xs text-muted-foreground mt-1">Pour 4 personnes — 148 €</p></div></div>
              </div>
            </section>

            <section className="py-24 bg-secondary" aria-labelledby="about-heading">
              <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-12 items-center">
                <div className="aspect-[3/4] bg-muted overflow-hidden"><img src="https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=500&h=700&fit=crop&auto=format" alt="Plat végétarien préparé avec soin par notre équipe" className="w-full h-full object-cover"/></div>
                <div className="space-y-6"><p className="text-xs tracking-widest uppercase text-accent">Notre histoire</p><h2 id="about-heading" className="text-4xl md:text-5xl font-semibold leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>Deux mains,<br/>une même passion.</h2><div className="space-y-4 text-muted-foreground leading-relaxed max-w-lg"><p>En 1999, <strong className="text-foreground font-medium">Julie</strong> et <strong className="text-foreground font-medium">José</strong> ont ouvert Vite &amp; Gourmand avec une idée simple : que chaque repas de fête mérite d&apos;être exceptionnel.</p><p>Vingt-cinq ans plus tard, leur cuisine reste entièrement artisanale — chaque assiette préparée dans leur atelier bordelais avec des produits de saison locaux.</p></div><blockquote className="flex gap-4 items-center pt-2"><div className="h-px flex-1 bg-border" aria-hidden="true"/><p className="text-sm italic text-muted-foreground" style={{fontFamily:"'Playfair Display',serif"}}>&quot;Cuisiner, c&apos;est donner du plaisir.&quot;</p><div className="h-px flex-1 bg-border" aria-hidden="true"/></blockquote></div>
              </div>
            </section>

            <section className="py-24 bg-background" aria-labelledby="featured-heading">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"><div><p className="text-xs tracking-widest uppercase text-accent mb-2" aria-hidden="true">Saison en cours</p><h2 id="featured-heading" className="text-4xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Nos menus du moment</h2></div><button onClick={()=>nav("menus")} className="text-sm text-primary hover:underline underline-offset-4 flex items-center gap-1 self-start md:self-auto">Voir tous les menus <CR size={14} aria-hidden="true"/></button></div>
                <ul className="grid sm:grid-cols-3 gap-6 list-none">
                  {featured.map(m=>{ const md=dishes.filter(d=>(m.dishIds || []).includes(d.id)); const al=[...new Set(md.flatMap(d=>d.allergens))]; return (
                    <li key={m.id}>
                      <article className="bg-card border border-border flex flex-col group hover:shadow-md transition-shadow h-full">
                        <div className="relative overflow-hidden h-44 bg-muted"><button onClick={()=>{ setSelId(m.id); nav("menu-detail"); }} className="w-full h-full" aria-label={`Voir le détail du menu ${m.title}`}><img src={(m.images && (m.images && (m.images && m.images[0]) || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format') || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format') || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format'} alt={m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/></button><div className="absolute top-3 left-3" aria-hidden="true"><ThemeBadge theme={m.theme}/></div></div>
                        <div className="flex flex-col flex-1 p-5 gap-3"><div><h3 className="text-base font-semibold leading-snug" style={{fontFamily:"'Playfair Display',serif"}}>{m.title}</h3><p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{m.description}</p></div><div className="flex justify-between text-sm border-t border-border pt-3 mt-auto"><span className="text-muted-foreground flex items-center gap-1"><UtensilsCrossed size={12} aria-hidden="true"/>{(m.minPeople || m.min_people || 4)} pers. min</span><span className="font-semibold text-primary" style={{fontFamily:"'Playfair Display',serif"}}>{fmt(m.price)}</span></div>{al.length>0&&<p className="text-[11px] text-amber-600 flex items-center gap-1"><AlertTriangle size={10} aria-hidden="true"/><span><span className="sr-only">Allergènes : </span>{al.slice(0,3).join(", ")}{al.length>3?"…":""}</span></p>}<button onClick={()=>{ setSelId(m.id); nav("menu-detail"); }} className="w-full py-2 border border-primary text-primary text-xs hover:bg-primary hover:text-primary-foreground transition-colors">Voir le détail</button></div>
                      </article>
                    </li>
                  ); })}
                </ul>
              </div>
            </section>

            {validatedReviews.length>0&&(
              <section className="py-20 bg-secondary" aria-labelledby="reviews-heading">
                <div className="max-w-6xl mx-auto px-6">
                  <div className="text-center mb-12"><p className="text-xs tracking-widest uppercase text-accent mb-2" aria-hidden="true">Ils nous font confiance</p><h2 id="reviews-heading" className="text-4xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Avis de nos clients</h2></div>
                  <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none">
                    {validatedReviews.slice(0,6).map((o,i)=>(
                      <li key={`${o.id}-${i}`}>
                        <figure className="bg-card border border-border p-6 space-y-3 h-full">
                          <StarRating value={o.review!.rating} label={`Note : ${o.review!.rating} étoile${o.review!.rating>1?"s":""}`}/>
                          <blockquote><p className="text-sm leading-relaxed italic text-muted-foreground">&quot;{o.review!.comment}&quot;</p></blockquote>
                          <figcaption className="pt-2 border-t border-border"><p className="text-sm font-medium">{o.firstName} {o.lastName.charAt(0)}.</p><p className="text-xs text-muted-foreground">{o.menuTitle}</p></figcaption>
                        </figure>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <section className="py-24 bg-background" aria-labelledby="how-heading">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-14"><p className="text-xs tracking-widest uppercase text-accent mb-2" aria-hidden="true">Simple &amp; rapide</p><h2 id="how-heading" className="text-4xl font-semibold" style={{fontFamily:"'Playfair Display',serif"}}>Comment ça marche ?</h2></div>
                <ol className="grid md:grid-cols-3 gap-10 list-none">{[{n:"01",t:"Parcourez les menus",d:"Explorez nos formules et filtrez par thème, régime ou prix."},{n:"02",t:"Créez votre compte",d:"Inscription rapide pour accéder à l'espace commande sécurisé."},{n:"03",t:"Commandez & profitez",d:"Julie ou José confirme sous 24 h et vous tient informé du suivi."}].map(({n,t,d})=><li key={n} className="flex gap-6"><span className="text-5xl font-bold text-border flex-shrink-0 leading-none" style={{fontFamily:"'Playfair Display',serif"}} aria-hidden="true">{n}</span><div><h3 className="font-semibold text-lg mb-2" style={{fontFamily:"'Playfair Display',serif"}}>{t}</h3><p className="text-sm text-muted-foreground leading-relaxed">{d}</p></div></li>)}</ol>
              </div>
            </section>
          </>
        )}
        {view==="menus"&&<AllMenusView menus={menus} dishes={dishes} onDetail={id=>{ setSelId(id); nav("menu-detail"); }}/>}
        {view==="menu-detail"&&selMenu&&<MenuDetailView menu={selMenu} dishes={dishes} user={user} onBack={()=>nav("menus")} onOrder={()=>{ setOrdMenuId(selMenu.id); nav("order"); }} onAuth={()=>openAuth("login")}/>}
        {view==="order"&&ordMenu&&user&&<OrderView menu={ordMenu} user={user} onBack={()=>nav("menus")} onConfirm={order=>{ setOrders(p=>[...p,order]); nav("user-space"); }}/>}
        {view==="user-space"&&user&&<UserSpaceView user={user} orders={orders} setOrders={setOrders}/>}
        {view==="admin"&&user&&(user.role==="admin"||user.role==="employee")&&<AdminPanel menus={menus} dishes={dishes} orders={orders} hours={hours} user={user} setMenus={setMenus} setDishes={setDishes} setOrders={setOrders} setHours={setHours}/>}
        {view==="contact"&&(
          <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs tracking-widest uppercase text-accent mb-2" aria-hidden="true">Parlons-nous</p>
              <h1 className="text-4xl font-semibold mb-6" style={{fontFamily:"'Playfair Display',serif"}}>Une occasion à fêter ?</h1>
              <p className="text-muted-foreground leading-relaxed mb-8">Pour toute demande — menu sur mesure, grande tablée, livraison hors Bordeaux — contactez Julie et José.</p>
              <ul className="space-y-4 text-sm list-none">{[{I:Phone,t:"05 56 12 34 56",href:"tel:+33556123456"},{I:Mail,t:"contact@viteetgourmand.fr",href:"mailto:contact@viteetgourmand.fr"},{I:MapPin,t:"Bordeaux & Gironde (livraison 50 km)",href:undefined}].map(({I,t,href})=><li key={t} className="flex items-center gap-3 text-muted-foreground"><I size={16} className="text-accent flex-shrink-0" aria-hidden="true"/>{href?<a href={href} className="hover:text-foreground transition-colors">{t}</a>:t}</li>)}</ul>
            </div>
            <ContactFormBlock/>
          </div>
        )}
      </main>

      <Footer hours={hours} onLegal={t=>setLegal(t)}/>
      {authOpen&&<AuthModal onClose={()=>setAuthOpen(false)} onLogin={u=>setUser(u)} initialTab={authTab}/>}
      {cartOpen&&<CartDrawer cart={cart} onClose={()=>setCartOpen(false)} onInc={incCart} onDec={decCart}/>}
      {legal&&<LegalModal type={legal} onClose={()=>setLegal(null)}/>}
    </div>
  );
}
