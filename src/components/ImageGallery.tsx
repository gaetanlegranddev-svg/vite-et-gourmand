// ============================================
// Vite & Gourmand — Image Gallery Component
// ============================================
import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [idx, setIdx] = useState(0);
  if (!images || !images.length) images = ['https://images.unsplash.com/photo-1688437307658-23a1039d9634?w=800&h=560&fit=crop&auto=format'];
  if (!images.length) return <div className="w-full h-72 bg-muted flex items-center justify-center text-muted-foreground" role="img" aria-label="Aucune image disponible"><ImageIcon size={32} aria-hidden="true"/></div>;
  return (
    <div className="relative overflow-hidden bg-muted" role="region" aria-label={`Galerie photos — ${title}`}>
      <img src={images[idx]} alt={`${title} — photo ${idx+1} sur ${images.length}`} className="w-full h-72 md:h-96 object-cover"/>
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx((idx-1+images.length)%images.length)} aria-label="Photo précédente" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/85 flex items-center justify-center hover:bg-background transition-colors focus-visible:outline-2 focus-visible:outline-primary"><ChevronLeft size={16} aria-hidden="true"/></button>
          <button onClick={() => setIdx((idx+1)%images.length)} aria-label="Photo suivante" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/85 flex items-center justify-center hover:bg-background transition-colors focus-visible:outline-2 focus-visible:outline-primary"><ChevronRight size={16} aria-hidden="true"/></button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Navigation galerie">
            {images.map((_,i) => <button key={i} role="tab" aria-selected={i===idx} aria-label={`Photo ${i+1}`} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i===idx?"bg-background":"bg-background/40"}`}/>)}
          </div>
          <span className="absolute top-3 right-3 text-[10px] bg-background/80 px-2 py-0.5" aria-live="polite" aria-atomic="true">{idx+1} / {images.length}</span>
        </>
      )}
    </div>
  );
}