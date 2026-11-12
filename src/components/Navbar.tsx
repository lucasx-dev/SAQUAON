import React, { useState } from 'react';
import {
  Menu,
  X,
  Compass,
  Waves,
  Store,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Sun,
  Wind,
  Droplets,
  ExternalLink,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { AudioPlayerPill } from './AudioPlayerPill';
import { AccountMenu } from './AccountMenu';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenMerchantModal: () => void;
  onOpenAppPreview: () => void;
  onEditBusiness?: (id: string) => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMerchantModal, onOpenAppPreview, onEditBusiness, onOpenAdmin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, openAuthModal, signOut } = useAuth();

  const navLinks = [
    { label: 'Radar do Mar', href: '#radar', icon: Waves },
    { label: 'Achar Meu Ponto', href: '#encontre-sua-praia', icon: Compass },
    { label: 'Igreja Histórica', href: '#igreja', icon: Landmark },
    { label: 'Quiosques & Gastronomia', href: '#marketplace', icon: Store },
    { label: 'Eventos & WSL', href: '#eventos', icon: Calendar },
    { label: 'Comunidade', href: '#comunidade', icon: MessageCircle },
    { label: 'Para Comerciantes', href: '#comerciantes', icon: Store, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF5EE]/95 backdrop-blur-md border-b border-[#004F8A]/15 shadow-xs transition-all">
      {/* Top micro banner with Live Coastal Ticker & Audio Pill */}
      <div className="bg-gradient-to-r from-[#003660] via-[#004F8A] to-[#002D52] text-white text-[11px] sm:text-xs py-1.5 px-4 font-medium border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Live indicator & condition ticker */}
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4FA8D8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-extrabold tracking-wider text-[#4FA8D8] uppercase text-[10px] sm:text-xs">
              BOLETIM AO VIVO:
            </span>
            <span className="truncate text-white/95 text-[11px] sm:text-xs">
              Itaúna 2.1m (Terral) • Praia da Vila 1.2m (Verde) • Barrinha 2.3m • Maré 0.4m Secando • Água 23°C
            </span>
          </div>

          {/* Right side status items */}
          <div className="hidden md:flex items-center gap-4 shrink-0 text-white/90">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guarda-Vidas Posto 1 & 2 Ativos</span>
            </span>

            <span className="text-white/30">|</span>

            <span className="flex items-center gap-1 text-[11px] text-amber-200">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Saquarema 27°C</span>
            </span>

            <span className="text-white/30">|</span>

            <AudioPlayerPill variant="inline" />
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-22">
          {/* Brand Logo - EXACT Logo matching the user's attachment */}
          <a
            href="#"
            className="flex items-center group py-1.5 transition-transform hover:opacity-95 focus:outline-none"
            aria-label="SAQUA ON - Início"
          >
            <div className="flex flex-col items-start">
              <img
                src="/logo-saquaon-horizontal.svg"
                alt="SAQUA ON - Uma nova forma de viver as praias de Saquarema."
                className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none transition-all group-hover:scale-[1.02]"
                loading="eager"
              />
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-xs 2xl:text-sm font-bold transition-all px-3 py-2 rounded-xl flex items-center gap-1.5 ${
                    link.highlight
                      ? 'text-[#004F8A] bg-[#4FA8D8]/15 hover:bg-[#4FA8D8]/25 border border-[#4FA8D8]/30 shadow-2xs'
                      : 'text-[#0A1E2F] hover:text-[#004F8A] hover:bg-black/5'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      link.highlight ? 'text-[#004F8A]' : 'text-slate-500 group-hover:text-[#004F8A]'
                    }`}
                  />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Desktop Compact Nav for medium screens (lg to xl) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-2">
            <a
              href="#radar"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <Waves className="w-3.5 h-3.5 text-[#004F8A]" />
              <span>Radar</span>
            </a>
            <a
              href="#encontre-sua-praia"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-[#004F8A]" />
              <span>Achar Ponto</span>
            </a>
            <a
              href="#igreja"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-700" />
              <span>Igreja</span>
            </a>
            <a
              href="#marketplace"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5 text-[#004F8A]" />
              <span>Quiosques</span>
            </a>
            <a
              href="#eventos"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-[#004F8A]" />
              <span>WSL</span>
            </a>
            <a
              href="#comunidade"
              className="text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#004F8A]" />
              <span>Comunidade</span>
            </a>
          </nav>

          {/* Action CTAs & Weather Capsule */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Weather Capsule Badge */}
            <div className="hidden 2xl:flex items-center gap-2 bg-white/80 border border-[#004F8A]/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>27°C Sol</span>
              <span className="text-slate-300">•</span>
              <Wind className="w-3.5 h-3.5 text-sky-500" />
              <span>9kt Terral</span>
            </div>

            {user ? (
              <AccountMenu onOpenMerchantModal={onOpenMerchantModal} onEditBusiness={onEditBusiness} onOpenAdmin={onOpenAdmin} />
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal({ view: 'login' })}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#0A1E2F] hover:text-[#004F8A] hover:bg-black/5 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenMerchantModal}
              className="text-xs font-bold text-[#004F8A] hover:text-[#003660] hover:bg-[#004F8A]/5 px-3.5 py-2 rounded-xl transition-all border border-[#004F8A]/20 cursor-pointer"
            >
              Sou Comerciante
            </button>

            <button
              type="button"
              onClick={onOpenAppPreview}
              className="bg-gradient-to-r from-[#004F8A] to-[#003B69] hover:from-[#003B69] hover:to-[#002D52] text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group active:scale-[0.98]"
            >
              <span>Viver a Praia</span>
              <ArrowRight className="w-4 h-4 text-[#4FA8D8] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Right Controls: Audio & Hamburger Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <AudioPlayerPill variant="inline" />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#004F8A] hover:bg-[#004F8A]/10 transition-colors focus:outline-none border border-[#004F8A]/15 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF5EE] border-b border-[#004F8A]/20 px-4 pt-3 pb-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Mobile Brand Header */}
          <div className="mb-4 pb-3 border-b border-[#004F8A]/10 flex items-center justify-between">
            <img
              src="/logo-saquaon-horizontal.svg"
              alt="SAQUA ON"
              className="h-9 w-auto object-contain"
            />
            <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              Ao Vivo
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    link.highlight
                      ? 'bg-[#004F8A]/10 text-[#004F8A] border border-[#004F8A]/15'
                      : 'text-[#0A1E2F] hover:bg-white/80'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#004F8A]/10 text-[#004F8A] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.label}</span>
                </a>
              );
            })}

            {/* Mobile Actions Container */}
            <div className="pt-4 mt-3 border-t border-[#004F8A]/10 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAppPreview();
                }}
                className="w-full bg-[#004F8A] hover:bg-[#003866] text-white font-extrabold py-3 px-4 rounded-xl text-center shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Acessar Plataforma Completa</span>
                <ArrowRight className="w-4 h-4 text-[#4FA8D8]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMerchantModal();
                }}
                className="w-full bg-white hover:bg-[#F0ECE1] text-[#004F8A] font-bold py-2.5 px-4 rounded-xl border border-[#004F8A]/20 text-center cursor-pointer text-xs"
              >
                Cadastrar Meu Quiosque / Negócio
              </button>

              {user ? (
                <div className="bg-white/70 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0A1E2F] truncate">{profile?.nome ?? user.email}</p>
                    <p className="text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void signOut();
                    }}
                    className="shrink-0 flex items-center gap-1.5 text-red-600 font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal({ view: 'login' });
                    }}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-[#F0ECE1] text-[#0A1E2F] font-bold py-2.5 px-3 rounded-xl border border-slate-200 text-xs cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Entrar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal({ view: 'cadastro' });
                    }}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-[#F0ECE1] text-[#004F8A] font-bold py-2.5 px-3 rounded-xl border border-[#004F8A]/20 text-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar conta</span>
                  </button>
                </div>
              )}

              {/* Mobile Weather Capsule */}
              <div className="mt-2 bg-white/70 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-[#004F8A]">Saquarema Hoje</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  27°C • Vento Terral 9kt
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
