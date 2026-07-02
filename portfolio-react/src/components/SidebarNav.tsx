import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';

const SECTIONS = [
  { id: 'experience', labelKey: 'nav.experience' },
  { id: 'projects', labelKey: 'nav.projects' },
  { id: 'education', labelKey: 'nav.education' },
  { id: 'skills', labelKey: 'nav.skills' },
  { id: 'contact', labelKey: 'nav.contact' },
];

export const SidebarNav = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [heroVisible, setHeroVisible] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    // Section tracking observer
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    // Hero visibility observer — hide sidebar when hero is in view
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    const heroEl = document.getElementById('hero');
    if (heroEl) heroObserver.observe(heroEl);

    return () => {
      sectionObserver.disconnect();
      heroObserver.disconnect();
    };
  }, []);

  return (
    <nav
      className={`hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ${
        heroVisible ? 'opacity-0 pointer-events-none translate-x-[-12px]' : 'opacity-100'
      }`}
    >
      <ul className="space-y-4 border-l border-border ml-2 relative">
        {SECTIONS.map(({ id, labelKey }) => {
          const isActive = activeSection === id;
          return (
            <li key={id} className="relative">
              <a
                href={`#${id}`}
                className={`block pl-6 text-sm transition-colors duration-200 ${
                  isActive ? 'text-teal-500 font-medium' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {/* Custom dot indicator for active/inactive state */}
                <div
                  className={`absolute left-[-5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-teal-500 ring-4 ring-teal-500/20'
                      : 'bg-transparent border-2 border-border hover:border-text-muted'
                  }`}
                />
                {t(labelKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
