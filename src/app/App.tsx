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
import MenuDetailView from '../components/MenuDetailView.tsx';
import OrderView from '../components/OrderView.tsx';
import UserSpaceView from '../components/UserSpace.tsx';
import AdminPanel from '../components/AdminPanel.tsx';
import StatsTab from '../components/StatsTab.tsx';
import { fmt, fmtDate, fmtDateShort, calcDeliveryFee, calcDiscount, validatePassword, nextStatus, STATUS_SEQUENCE, STATUS_LABELS, STATUS_COLORS, CHART_COLORS } from '../utils/helpers.ts';
import CancelOrderModal from '../components/CancelOrderModal.tsx';
import AdvanceStatusModal from '../components/AdvanceStatusModal.tsx';
import OrderModifyModal from '../components/OrderModifyModal.tsx';
import TeamTab from '../components/TeamTab.tsx';
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
