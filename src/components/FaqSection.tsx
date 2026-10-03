import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, Sparkles } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Fiyatlandırma neden sitede sabit değil de araç başında yapılıyor?',
    a: 'Her aracın kaporta boya durumu, çizik derinliği, boyutu ve kirlilik oranı farklıdır. Amacımız müşterilerimize haksız veya şişirilmiş sabit paketler sunmak yerine; aracınızın başında boya kalınlık ölçer ve LED detailing ışığıyla inceleme yaparak en şeffaf ve adil fiyatı sunmaktır.',
    category: 'fiyat',
  },
  {
    q: 'Koltuk yıkandıktan sonra koltuklar ıslak mı kalır?',
    a: 'Hayır. Kullandığımız endüstriyel yüksek vakumlu ekstraksiyon makineleri kumaşın içindeki nemin %90’ını anında çeker. Sıcak hava kurutma fanlarımızla işlem desteklenir ve ortalama 1-2 saatlik normal havalandırma ile tamamen kupkuru teslim edilir.',
    category: 'hizmet',
  },
  {
    q: 'Pasta cila ve seramik kaplama ne kadar sürer?',
    a: 'Aracın boya kondisyonuna göre pasta cila işlemi ortalama 3 - 5 saat sürer. Seramik kaplama uygulamasında ise katmanların kürleşmesi (kuruma ve tutunma) için aracın 1 gün süreyle işletmemizde kalması tavsiye edilir.',
    category: 'sure',
  },
  {
    q: 'Pazar günleri açık mısınız?',
    a: 'Hayır, işletmemiz Pazar günleri kapalıdır. Pazartesi - Cumartesi günleri 08:30 - 18:30 saatleri arasında randevulu ve kesintisiz hizmet vermekteyiz.',
    category: 'genel',
  },
  {
    q: 'Oluşturduğum randevuyu iptal edebilir veya saatini değiştirebilir miyim?',
    a: 'Evet, randevu bilet sayfanızdaki "Randevuyu İptal Et / Değiştir" butonuyla WhatsApp üzerinden tek tıkla işletmemize iptal talebini iletebilir ve sistemden yeni gün/saat seçebilirsiniz.',
    category: 'randevu',
  },
  {
    q: 'Kredi kartı ve temassız ödeme geçerli mi?',
    a: 'Evet. İşletmemizde tüm banka kredi kartları, banka kartları ve temassız ödeme seçenekleri geçerlidir.',
    category: 'genel',
  },
  {
    q: 'Randevu alırken Peron 1 ve Peron 2 neye göre belirleniyor?',
    a: 'Peron 1, özel LED detailing ışıkları ve polisaj ekipmanlarıyla donatılmış "Detaylı Kuaför & Pasta Cila" peronumuzdur. Peron 2 ise "Hızlı & Periyodik Yıkama" peronudur. Seçtiğiniz hizmetlerin süresi ve türüne göre sistem peronunuzu otomatik atar.',
    category: 'randevu',
  },
];

export const FaqSection: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [search, setSearch] = useState<string>('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="py-12 sm:py-16 max-w-4xl mx-auto px-3 sm:px-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Merak Edilenler</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Sıkça Sorulan Sorular
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Aydın Efeler Esse Oto Yıkama hizmetleri, randevu süreci ve fiyatlandırma hakkında bilmeniz gerekenler.
        </p>

        {/* Search Bar */}
        <div className="pt-3 max-w-md mx-auto">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${
            isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white'
          }`}>
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sorularda arayın (Örn: Fiyat, Koltuk, Pazar)..."
              className="w-full bg-transparent text-xs outline-none text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIdx === index;

          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all glass-panel overflow-hidden ${
                isOpen
                  ? 'border-amber-500/40 bg-amber-500/[0.04]'
                  : isDarkMode
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="font-bold text-xs sm:text-sm leading-snug text-zinc-100">
                  {faq.q}
                </span>
                <div className={`p-1.5 rounded-xl border transition-transform duration-200 shrink-0 ${
                  isOpen
                    ? 'rotate-180 bg-amber-500 text-black border-amber-400'
                    : 'border-white/10 text-zinc-400'
                }`}>
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Aradığınız kriterle eşleşen soru bulunamadı. Lütfen <strong>0552 943 91 68</strong> numaralı hattan bize ulaşın.
          </div>
        )}
      </div>
    </section>
  );
};
