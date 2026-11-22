import { useState } from 'react';
import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import { formatCurrencyTRY, PRODUCTS } from '../data/catalog';
import { BagItem } from '../types';
import { calculateBagTotal } from '../utils/wardrobe';

interface BagDrawerProps {
  open: boolean;
  bag: BagItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onClearBag: () => void;
}

export function BagDrawer({
  open,
  bag,
  onClose,
  onUpdateQuantity,
  onClearBag,
}: BagDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string | null>(null);

  if (!open) return null;

  const total = calculateBagTotal(bag, PRODUCTS);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerAddress.trim()) {
      setCheckoutError('Lütfen teslimat için ad soyad ve adres bilgilerini girin.');
      return;
    }
    setCheckoutError('');
    setConfirmedOrderCode('VRD-1042');
    onClearBag();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1A1816]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Alışveriş Çantası"
    >
      <div className="w-full max-w-md bg-[#F5F2EC] h-full shadow-2xl flex flex-col justify-between border-l border-[#1A1816]/10">
        <div className="px-6 py-5 border-b border-[#1A1816]/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[#1A1816]">Çanta</h2>
            <p className="text-xs text-[#6A635A] mt-0.5">
              Denediğiniz ve beğendiğiniz parçalar
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrderCode(null);
              onClose();
            }}
            aria-label="Çantayı kapat"
            className="w-9 h-9 rounded-full border border-[#1A1816]/15 flex items-center justify-center text-[#1A1816] hover:bg-[#EBE7DF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {confirmedOrderCode ? (
            <div className="p-6 rounded-2xl bg-[#FAF8F4] border border-[#1A1816]/10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#495A42] mx-auto" aria-hidden="true" />
              <h3 className="font-serif text-2xl text-[#1A1816]">
                Sipariş #{confirmedOrderCode} Onaylandı
              </h3>
              <p className="text-sm text-[#6A635A]">
                {customerName} adına gönderiniz hazırlanıyor. Denediğiniz diğer parçalar sanal gardırobunuzda saklanmaya devam ediyor.
              </p>
            </div>
          ) : bag.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-2xl text-[#1A1816]">Çantanız boş</p>
              <p className="text-sm text-[#6A635A] mt-2">
                Sanal Kabin&apos;de ürünleri üzerinizde deneyip gardırobunuza kaydedebilir veya dilediğinizde buradan sipariş verebilirsiniz.
              </p>
            </div>
          ) : (
            bag.map((item, idx) => {
              const product = PRODUCTS.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <div
                  key={`${item.productId}-${item.size}-${item.color.name}`}
                  className="p-4 rounded-xl bg-[#FAF8F4] border border-[#1A1816]/10 flex gap-4"
                >
                  <div className="w-20 h-20 rounded-lg bg-white border border-[#1A1816]/5 p-2 shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#1A1816] truncate">
                        {product.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(idx, -item.quantity)}
                        aria-label={`${product.name} çantadan kaldır`}
                        className="text-[#6A635A] hover:text-[#1A1816]"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6A635A] mt-0.5">
                      Beden {item.size} · {item.color.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#1A1816]/15 rounded-full bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, -1)}
                          aria-label={`${product.name} adedini azalt`}
                          className="w-7 h-7 flex items-center justify-center text-[#1A1816]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, 1)}
                          aria-label={`${product.name} adedini artır`}
                          className="w-7 h-7 flex items-center justify-center text-[#1A1816]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-[#1A1816] tabular-nums">
                        {formatCurrencyTRY(product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {bag.length > 0 && !confirmedOrderCode && (
          <form
            onSubmit={handleCheckout}
            className="px-6 py-5 border-t border-[#1A1816]/10 bg-[#FAF8F4] space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6A635A]">Ara Toplam (Ücretsiz Kargo)</span>
              <span className="text-lg font-semibold text-[#1A1816] tabular-nums">
                {formatCurrencyTRY(total)}
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="bag-customer-name" className="sr-only">
                Ad Soyad
              </label>
              <input
                id="bag-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#1A1816]/15 rounded-lg text-[#1A1816] placeholder:text-[#8E867B] focus:outline-none focus:border-[#1A1816]"
              />
              <label htmlFor="bag-customer-address" className="sr-only">
                Teslimat Adresi
              </label>
              <input
                id="bag-customer-address"
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Teslimat Adresi"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#1A1816]/15 rounded-lg text-[#1A1816] placeholder:text-[#8E867B] focus:outline-none focus:border-[#1A1816]"
              />
            </div>

            {checkoutError && (
              <p className="text-xs text-[#9E2A2B]" role="alert">
                {checkoutError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#1A1816] text-[#F5F2EC] text-xs tracking-[0.12em] uppercase font-medium hover:bg-[#312D29] transition-colors"
            >
              Siparişi Tamamla
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
