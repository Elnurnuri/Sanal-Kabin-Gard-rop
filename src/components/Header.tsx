import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  wardrobeCount: number;
  bagCount: number;
  onOpenBag: () => void;
}

export function Header({
  activeView,
  onNavigate,
  wardrobeCount,
  bagCount,
  onOpenBag,
}: HeaderProps) {
  const [showPromo, setShowPromo] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ViewMode; label: string }[] = [
    { id: 'studio', label: 'Sanal Kabin' },
    { id: 'lookbook', label: 'Koleksiyonlar' },
    { id: 'catalog', label: 'Katalog' },
    {
      id: 'wardrobe',
      label: wardrobeCount > 0 ? `Gardırobum (${wardrobeCount})` : 'Gardırobum',
    },
  ];

  const handleSelectNav = (id: ViewMode) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5F2EC]/95 backdrop-blur-md border-b border-[#1A1816]/10">
      {showPromo && (
        <div className="bg-[#1A1816] text-[#F5F2EC] h-8 px-4 flex items-center justify-between text-[11px] tracking-[0.14em] uppercase">
          <span className="w-6 shrink-0" aria-hidden="true" />
          <p className="truncate text-center font-medium">
            Satın almadan önce sanal kabinde dene · Ücretsiz gardırop kaydı
          </p>
          <button
            type="button"
            onClick={() => setShowPromo(false)}
            aria-label="Duyuruyu kapat"
            className="w-6 h-6 flex items-center justify-center text-[#F5F2EC]/70 hover:text-[#F5F2EC] transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelectNav('studio')}
          className="font-serif text-2xl sm:text-[28px] tracking-[0.22em] font-medium text-[#1A1816] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A1816]"
        >
          VARDE
        </button>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav
          aria-label="Ana menü"
          className="hidden md:flex items-center gap-7 text-xs tracking-[0.12em] uppercase font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`py-1.5 border-b transition-colors whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A1816] ${
                  isActive
                    ? 'border-[#1A1816] text-[#1A1816]'
                    : 'border-transparent text-[#6A635A] hover:text-[#1A1816]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Alışveriş çantasını aç (${bagCount} ürün)`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-[0.1em] uppercase font-medium bg-[#1A1816] text-[#F5F2EC] rounded-full hover:bg-[#312D29] transition-colors whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1816]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Çanta ({bagCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-full border border-[#1A1816]/15 text-[#1A1816]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobil menü"
          className="md:hidden border-t border-[#1A1816]/10 bg-[#F5F2EC] px-4 py-3 flex flex-col gap-1"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full text-left px-3 py-2.5 text-xs tracking-[0.12em] uppercase font-medium rounded-lg transition-colors tabular-nums ${
                  isActive
                    ? 'bg-[#1A1816] text-[#F5F2EC]'
                    : 'text-[#1A1816] hover:bg-[#1A1816]/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
