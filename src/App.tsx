import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SaquaremaChurchSection } from './components/SaquaremaChurchSection';
import { BeachRadar } from './components/BeachRadar';
import { InteractiveFinder } from './components/InteractiveFinder';
import { KioskMarketplace } from './components/KioskMarketplace';
import { SurfCapitalWsl } from './components/SurfCapitalWsl';
import { MerchantConversion } from './components/MerchantConversion';
import { SocialProofAndFaq } from './components/SocialProofAndFaq';
import { Footer } from './components/Footer';
import { MerchantModal } from './components/MerchantModal';
import { UserExperienceModal } from './components/UserExperienceModal';
import { AudioPlayerPill } from './components/AudioPlayerPill';
import { MobileFloatingBar } from './components/MobileFloatingBar';
import { AuthModal } from './components/AuthModal';
import { ReviewModal } from './components/ReviewModal';
import { ConfigNotice } from './components/ConfigNotice';
import { Community } from './components/Community';
import { MyBusinessModal } from './components/MyBusinessModal';
import { AdminPanel } from './components/AdminPanel';
import { ReportDialog, type ReportTargetInfo } from './components/ReportDialog';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import type { KioskMerchant, PlanCode } from './types';

export default function App() {
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanCode>('pago');
  const [reviewTarget, setReviewTarget] = useState<KioskMerchant | null>(null);
  const [editBusinessId, setEditBusinessId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<ReportTargetInfo | null>(null);
  const { requireAuth } = useAuth();
  const { refreshMerchants } = useData();
  const [isUserPreviewModalOpen, setIsUserPreviewModalOpen] = useState<boolean>(false);
  const [selectedRadarBeachId, setSelectedRadarBeachId] = useState<string>('itauna');
  const [filteredMarketplaceBeach, setFilteredMarketplaceBeach] = useState<string | undefined>(undefined);

  // Cadastrar estabelecimento exige conta: quem não está logado cria a conta (ou entra) e a janela abre em seguida.
  const handleOpenMerchantModal = (planCode: PlanCode = 'pago') => {
    requireAuth(
      () => {
        setSelectedPlanForModal(planCode);
        setIsMerchantModalOpen(true);
      },
      { view: 'cadastro', tipo: 'comerciante' }
    );
  };

  // "Viver a Praia": quem não tem conta cria uma; quem já tem vê as boas-vindas.
  const handleOpenAppPreview = () => {
    requireAuth(() => setIsUserPreviewModalOpen(true), { view: 'cadastro', tipo: 'turista' });
  };

  // Avaliar também exige estar logado
  const handleReview = (merchant: KioskMerchant) => {
    requireAuth(() => setReviewTarget(merchant), { view: 'login' });
  };

  const handleReportMerchant = (merchant: KioskMerchant) => {
    requireAuth(() => setReportTarget({ tipo: 'estabelecimento', id: merchant.id, titulo: merchant.name }), { view: 'login' });
  };

  const handleSelectBeachFromHero = (beachId: string) => {
    setSelectedRadarBeachId(beachId);
    const element = document.getElementById('radar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilterMarketplaceByBeach = (beachName: string) => {
    setFilteredMarketplaceBeach(beachName);
    const element = document.getElementById('marketplace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToMarketplaceFromFinder = () => {
    const element = document.getElementById('marketplace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EE] text-[#0A1E2F] font-sans selection:bg-[#4FA8D8]/30 selection:text-[#004F8A]">
      <ConfigNotice />

      {/* Top sticky navigation */}
      <Navbar
        onOpenMerchantModal={() => handleOpenMerchantModal('pago')}
        onOpenAppPreview={handleOpenAppPreview}
        onEditBusiness={setEditBusinessId}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main landing content */}
      <main className="flex-1">
        {/* 1. Immersive Hero Section */}
        <Hero
          onOpenMerchantModal={() => handleOpenMerchantModal('pago')}
          onSelectBeach={handleSelectBeachFromHero}
        />

        {/* 2. Historic Cultural Landmark: Igreja de Nossa Senhora de Nazareth */}
        <SaquaremaChurchSection onSelectBeach={handleSelectBeachFromHero} />

        {/* 3. Real-time Marine & Weather Conditions (Radar Beira-Mar) */}
        <BeachRadar
          selectedBeachId={selectedRadarBeachId}
          onFilterMarketplaceByBeach={handleFilterMarketplaceByBeach}
        />

        {/* 3. Interactive Vibe & Spot Matcher ("Descubra Seu Ponto Ideal") */}
        <InteractiveFinder onGoToMarketplace={handleGoToMarketplaceFromFinder} />

        {/* 4. Local Kiosks & Merchants Marketplace */}
        <KioskMarketplace
          onOpenMerchantModal={() => handleOpenMerchantModal('pago')}
          filteredBeach={filteredMarketplaceBeach}
          onClearBeachFilter={() => setFilteredMarketplaceBeach(undefined)}
          onReview={handleReview}
          onReport={handleReportMerchant}
        />

        {/* 5. WSL Saquarema Pro & Sporting/Cultural Events */}
        <SurfCapitalWsl onOpenAppPreview={handleOpenAppPreview} />

        {/* 6. B2B Monetization & Merchant Conversion (ROI Simulator & Plans) */}
        <MerchantConversion onOpenMerchantModal={handleOpenMerchantModal} />

        {/* 7. Social Proof, Testimonials & FAQ */}
        <SocialProofAndFaq onOpenAppPreview={handleOpenAppPreview} />

        {/* 8. Comunidade: publicações, comentários e denúncias */}
        <Community onReport={setReportTarget} />
      </main>

      {/* Footer */}
      <Footer
        onOpenMerchantModal={() => handleOpenMerchantModal('pago')}
        onOpenAppPreview={handleOpenAppPreview}
      />

      {/* Floating Audio Atmosphere Controller */}
      <AudioPlayerPill variant="floating" />

      {/* Floating Navigation Bar for Mobile */}
      <MobileFloatingBar
        onOpenMerchantModal={() => handleOpenMerchantModal('pago')}
        onOpenAppPreview={handleOpenAppPreview}
      />

      {/* Merchant Registration Modal */}
      <MerchantModal
        isOpen={isMerchantModalOpen}
        onClose={() => setIsMerchantModalOpen(false)}
        defaultPlan={selectedPlanForModal}
      />

      {/* Welcome / push preview for logged-in users */}
      <UserExperienceModal
        isOpen={isUserPreviewModalOpen}
        onClose={() => setIsUserPreviewModalOpen(false)}
      />

      {/* Review modal (1-5 stars + comment) */}
      <ReviewModal
        merchant={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSaved={() => void refreshMerchants()}
      />

      {/* Editar estabelecimento (dados, fotos, cardápio, promoções) */}
      <MyBusinessModal
        businessId={editBusinessId}
        onClose={() => setEditBusinessId(null)}
        onSaved={() => void refreshMerchants()}
      />

      {/* Painel do administrador */}
      <AdminPanel open={isAdminOpen} onClose={() => setIsAdminOpen(false)} onChanged={() => void refreshMerchants()} />

      {/* Denúncias */}
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />

      {/* Login / signup / password recovery */}
      <AuthModal />
    </div>
  );
}

