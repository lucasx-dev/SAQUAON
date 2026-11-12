import React, { useState } from 'react';
import { KioskMerchant } from '../types';
import { useData } from '../context/DataContext';
import { FALLBACK_IMAGE } from '../lib/placeholders';
import { KiosksMap } from './KiosksMap';
import {
  Store,
  Star,
  MessageCircle,
  ShieldCheck,
  Search,
  Filter,
  Check,
  MapPin,
  Tag,
  ArrowUpRight,
  ExternalLink,
  UtensilsCrossed,
  Map,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface KioskMarketplaceProps {
  onOpenMerchantModal: () => void;
  filteredBeach?: string;
  onClearBeachFilter: () => void;
  onReview: (merchant: KioskMerchant) => void;
  onReport?: (merchant: KioskMerchant) => void;
}

export const KioskMarketplace: React.FC<KioskMarketplaceProps> = ({
  onOpenMerchantModal,
  filteredBeach,
  onClearBeachFilter,
  onReview,
  onReport,
}) => {
  const { merchants, loading, error } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAmenityFilter, setActiveAmenityFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const categories = ['Todos', 'Quiosque', 'Restaurante', 'Escola de Surf', 'Pousada', 'Ambulante'];

  const filteredMerchants = merchants.filter((merchant) => {
    // Beach filter
    if (filteredBeach && !merchant.beach.toLowerCase().includes(filteredBeach.toLowerCase())) {
      // If filtering by specific beach, check
      return false;
    }
    // Category filter
    if (selectedCategory !== 'Todos' && merchant.category !== selectedCategory) {
      return false;
    }
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = merchant.name.toLowerCase().includes(q);
      const matchesDish = (merchant.featuredDish ?? '').toLowerCase().includes(q);
      const matchesSpecialty = merchant.specialty.toLowerCase().includes(q);
      const matchesBeach = merchant.beach.toLowerCase().includes(q);
      if (!matchesName && !matchesDish && !matchesSpecialty && !matchesBeach) {
        return false;
      }
    }
    // Amenity filter
    if (activeAmenityFilter !== 'Todos') {
      const hasAmenity = merchant.amenities.some((a) =>
        a.toLowerCase().includes(activeAmenityFilter.toLowerCase())
      );
      if (!hasAmenity) return false;
    }
    return true;
  });

  return (
    <section id="marketplace" className="py-16 lg:py-24 bg-[#FAF5EE] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#004F8A] bg-[#004F8A]/10 px-3 py-1 rounded-full mb-3">
              <Store className="w-3.5 h-3.5 text-[#4FA8D8]" />
              <span>Comércio Local & Experiências à Beira-Mar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-[#0A1E2F] tracking-tight">
              Os Melhores Quiosques & Serviços de Saquarema
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
              Descubra onde comer o melhor camarão, tomar água de coco trincando, alugar pranchas ou relaxar com
              ducha de água doce e segurança.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenMerchantModal}
              className="bg-[#004F8A] hover:bg-[#003866] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#4FA8D8]" />
              <span>Cadastrar Meu Ponto / Quiosque</span>
            </button>
          </div>
        </div>

        {/* Active Beach Filter Banner if applied */}
        {filteredBeach && (
          <div className="mb-6 p-3.5 bg-[#4FA8D8]/15 border border-[#4FA8D8]/40 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#004F8A]">
              <MapPin className="w-4 h-4 text-[#004F8A]" />
              <span>
                Filtrando apenas estabelecimentos em <strong>{filteredBeach}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onClearBeachFilter}
              className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
            >
              Ver todas as praias
            </button>
          </div>
        )}

        {/* Search & Category Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por pastel, peixe, prancha, nome do quiosque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004F8A]/30 focus:border-[#004F8A] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Categories Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#004F8A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#004F8A] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-[#004F8A] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Map className="w-4 h-4" />
              Mapa
            </button>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'map' ? (
          <div className="mb-10">
            <KiosksMap 
              kiosks={filteredMerchants} 
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} 
            />
          </div>
        ) : (
          <>
            {/* Merchants Cards Grid */}
            {loading && merchants.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-10 h-10 text-[#004F8A] mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-600">Carregando estabelecimentos...</p>
              </div>
            ) : error && merchants.length === 0 ? (
              <div role="alert" className="text-center py-16 bg-white rounded-2xl border border-red-200">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : filteredMerchants.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Nenhum estabelecimento encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente buscar com outros termos ou limpe os filtros de praia e categoria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
                onClearBeachFilter();
              }}
              className="mt-4 bg-[#004F8A] text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 flex flex-col justify-between group"
              >
                <div>
                  {/* Image with Tag and Promo */}
                  <div className="relative aspect-16/10 overflow-hidden">
                    <img
                      src={merchant.image || FALLBACK_IMAGE}
                      alt={merchant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    {/* Category pill */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {merchant.category}
                    </div>

                    {/* Beach tag */}
                    <div className="absolute bottom-3 left-3 bg-[#004F8A]/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#4FA8D8]" />
                      <span>{merchant.beach}</span>
                    </div>

                    {/* Promo badge if exists */}
                    {merchant.promo && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-md">
                        {merchant.promo}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    {/* Rating & Verified */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap text-xs">
                        {merchant.reviewCount > 0 ? (
                          <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                            <Star className="w-4 h-4 fill-amber-400" />
                            <span>{merchant.rating.toFixed(1)}</span>
                            <span className="text-slate-400 font-normal">({merchant.reviewCount} avaliações)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">Novo no SAQUA ON</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onReview(merchant)}
                          className="text-[11px] font-bold text-[#004F8A] hover:underline cursor-pointer"
                        >
                          Avaliar
                        </button>
                        {onReport && (
                          <button
                            type="button"
                            onClick={() => onReport(merchant)}
                            className="text-[11px] font-bold text-slate-400 hover:text-red-600 hover:underline cursor-pointer"
                          >
                            Denunciar
                          </button>
                        )}
                      </div>

                      {merchant.verified && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verificado</span>
                        </div>
                      )}
                    </div>

                    {/* Name & Specialty */}
                    <h3 className="font-bold text-lg text-[#0A1E2F] group-hover:text-[#004F8A] transition-colors leading-snug mb-1">
                      {merchant.name}
                    </h3>
                    {merchant.specialty && <p className="text-xs text-slate-600 mb-3">{merchant.specialty}</p>}

                    {/* Featured Dish Box */}
                    {merchant.featuredDish && (
                      <div className="bg-[#FAF5EE] p-3 rounded-xl border border-[#004F8A]/10 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate pr-2 flex items-center gap-1.5">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{merchant.featuredDish}</span>
                          </span>
                          <span className="font-black text-[#004F8A] shrink-0">
                            {merchant.featuredPrice}
                          </span>
                        </div>
                        {merchant.featuredNote && (
                          <p className="text-[10px] text-slate-500 mt-1">{merchant.featuredNote}</p>
                        )}
                      </div>
                    )}

                    {/* Amenities tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {merchant.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action: Direct WhatsApp Conversion */}
                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 py-2">
                    <span className="truncate">{merchant.distanceOrAddress}</span>
                    {merchant.instagram && (
                      <span className="text-slate-500 font-medium shrink-0 ml-2">
                        {merchant.instagram}
                      </span>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${merchant.whatsAppNumber}?text=${encodeURIComponent(
                      `Olá! Vi o perfil do ${merchant.name} no app SAQUA ON e gostaria de tirar uma dúvida!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>Falar no WhatsApp Direto</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* Commercial Invitation Banner */}
        <div className="mt-12 bg-linear-to-r from-[#004F8A] to-[#023359] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
          <div>
            <span className="text-[#4FA8D8] text-xs font-black uppercase tracking-wider block mb-1">
              Oportunidade para o Comércio de Saquarema
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-display leading-tight">
              Tem um quiosque, pousada, restaurante ou trabalha na areia?
            </h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
              Cadastre seu estabelecimento gratuitamente e seja encontrado por milhares de turistas e moradores
              todos os dias.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenMerchantModal}
            className="shrink-0 bg-[#4FA8D8] hover:bg-[#3A96C9] text-[#0A1E2F] font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Quero Cadastrar Meu Negócio
          </button>
        </div>
      </div>
    </section>
  );
};
