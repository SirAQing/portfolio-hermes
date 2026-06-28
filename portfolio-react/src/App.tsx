import { HeroSection } from './components/HeroSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ProjectsSection } from './components/ProjectsSection';
import { EducationSection, CertificationsSection, SkillsSection } from './components/MiscSections';
import { HeaderActions } from './components/HeaderActions';
import { SidebarNav } from './components/SidebarNav';
import { FloatingAssistant } from './components/FloatingAssistant';
import { AuthModal } from './components/AuthModal';
import { KnowledgeBase } from './components/knowledge/KnowledgeBase';
import { useHashRouter } from './hooks/useHashRouter';
import { I18nProvider, useI18n } from './i18n';
import { AuthProvider } from './auth/AuthContext';
import { useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const ContactSection = () => {
  const { t } = useI18n();
  return (
    <section id="contact" className="py-32 flex flex-col items-center text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-accent mb-6 tracking-tight">{t('contact.title')}</h2>
      <p className="text-text-secondary max-w-md mx-auto mb-10 leading-relaxed text-lg">
        {t('contact.desc')}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a href="mailto:lmq0205a@163.com"
           className="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity text-sm flex items-center gap-2 shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          {t('contact.email')}
        </a>
        <a href="https://x.com/liumingqingoh" target="_blank" rel="noreferrer"
           className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-medium rounded-full hover:opacity-90 transition-opacity text-sm flex items-center gap-2 shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          {t('contact.x')}
        </a>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border-subtle py-8 flex justify-between items-center text-xs text-text-muted mt-12">
      <span>{t('footer.copyright')}</span>
    </footer>
  );
};

function AppContent() {
  const [route, navigate] = useHashRouter();

  // Pre-warm the backend on first page load so AI chat is responsive
  useEffect(() => {
    fetch(`${API_BASE}/api/warmup`).catch(() => {});
  }, []);

  // Knowledge base page
  if (route.page === 'knowledge') {
    return <KnowledgeBase articleSlug={route.articleSlug} onNavigate={navigate} />;
  }

  // Portfolio (home) page
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased selection:bg-white/20 dot-bg relative">
      <HeaderActions />
      <SidebarNav />

      <a href="#hero" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-accent focus:text-bg-base focus:z-50">
        Skip to content
      </a>

      {/* Hero — full-width with glow overlay */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hero-glow-1"></div>
        <div className="absolute inset-0 pointer-events-none hero-glow-2"></div>
        <div className="max-w-4xl mx-auto px-6 lg:pl-32">
          <HeroSection />
        </div>
      </div>

      {/* Experience — full-width alt background */}
      <div className="bg-bg-section-alt">
        <div className="max-w-4xl mx-auto px-6 lg:pl-32">
          <ExperienceSection />
        </div>
      </div>

      {/* Projects — base background */}
      <div className="max-w-4xl mx-auto px-6 lg:pl-32">
        <ProjectsSection />
      </div>

      {/* Education + Certifications — full-width alt background */}
      <div className="bg-bg-section-alt">
        <div className="max-w-4xl mx-auto px-6 lg:pl-32">
          <EducationSection />
          <CertificationsSection />
        </div>
      </div>

      {/* Skills — base background */}
      <div className="max-w-4xl mx-auto px-6 lg:pl-32">
        <SkillsSection />
      </div>

      {/* Contact — full-width alt background */}
      <div className="bg-bg-section-alt">
        <div className="max-w-4xl mx-auto px-6 lg:pl-32">
          <ContactSection />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:pl-32">
        <Footer />
      </div>

      <FloatingAssistant />
      <AuthModal />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
