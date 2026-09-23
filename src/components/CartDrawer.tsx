// ============================================
// Vite & Gourmand — Cart Drawer Component
// ============================================
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { fmt } from "../utils/helpers.ts";

interface MenuData {
  id: string; title: string; images: string[]; price: number;
  minPeople: number; min_people: number; [key: string]: any;
}
interface CartItem { menu: MenuData; qty: number }

interface CartDrawerProps {
  cart: CartItem[];
  onClose: () => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
}

export default function CartDrawer({ cart, onClose, onInc, onDec }: CartDrawerProps) {
  const total = cart.reduce((s, c) => s + (c.menu.price * c.qty), 0);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Panier">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div className="relative bg-card w-full max-w-sm flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2"><ShoppingCart size={18} aria-hidden="true"/>Mon panier</h2>
          <button onClick={onClose} aria-label="Fermer le panier"><X size={18} aria-hidden="true"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Votre panier est vide.</p>
          ) : cart.map(c => (
            <div key={c.menu.id} className="flex items-center gap-4 border-b border-border pb-4">
              <img src={(c.menu.images?.[0]) || 'https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=200&h=200&fit=crop&auto=format'} alt={c.menu.title} className="w-16 h-16 object-cover flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.menu.title}</p>
                <p className="text-sm text-primary">{fmt(c.menu.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onDec(c.menu.id)} aria-label="Diminuer la quantité" className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary"><Minus size={12} aria-hidden="true"/></button>
                <span className="text-sm w-4 text-center">{c.qty}</span>
                <button onClick={() => onInc(c.menu.id)} aria-label="Augmenter la quantité" className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary"><Plus size={12} aria-hidden="true"/></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t border-border">
            <div className="flex justify-between text-sm font-medium mb-4">
              <span>Total</span>
              <span className="text-primary">{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}