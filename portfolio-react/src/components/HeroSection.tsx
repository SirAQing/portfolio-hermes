import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Star, GitFork, BookOpen, MessageSquare, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n';
import avatarImg from '../assets/avatar.jpg';

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);

  // Reset when text changes (e.g. language switch)
  useEffect(() => {
    setDisplayedText('');
    setDone(false);
  }, [text]);

  useEffect(() => {
    if (done) return;
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 60);
      return () => clearTimeout(timeout);
    } else {
      setDone(true);
    }
  }, [displayedText, text, done]);

  return (
    <span>
      {displayedText}
      {!done && <span className="animate-pulse text-blue-400 ml-0.5">|</span>}
    </span>
  );
};

const RoleBadge = ({ label, active, stars, forks }: { label: string, active?: boolean, stars?: string, forks?: string }) => {
  if (stars || forks) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs bg-bg-pill transition-colors hover:border-text-muted">
        <span className="font-medium text-text-primary">{label}</span>
        {(stars || forks) && (
          <div className="flex items-center gap-1.5 border-l border-border pl-2 text-text-muted">
            {stars && <span className="flex items-center gap-0.5"><Star size={10} className="text-star-color" /> {stars}</span>}
            {forks && <span className="flex items-center gap-0.5"><GitFork size={10} /> {forks}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-block px-3 py-1.5 text-xs rounded-full border ${active ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-medium' : 'border-border text-text-secondary'} bg-bg-pill transition-colors`}>
      {label}
    </span>
  );
};

const NavCTA = ({ href, label, icon: Icon }: { href: string, label: string, icon?: any }) => {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary transition-all hover:border-text-muted hover:shadow-sm bg-bg-pill"
    >
      {Icon && <Icon size={14} className="text-text-muted" />}
      {label}
    </a>
  );
};

const PrimaryCTA = ({ href, label, icon: Icon, onClick }: { href?: string, label: string, icon?: any, onClick?: () => void }) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 transition-all hover:opacity-90 hover:shadow-md cursor-pointer"
    >
      {Icon && <Icon size={14} />}
      {label}
    </a>
  );
};

export const HeroSection = () => {
  const { t } = useI18n();

  // Stagger entrance animation variants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

  return (
    <section id="hero" className="pt-20 pb-12 md:pt-32 md:pb-16 flex flex-col items-center text-center relative z-10 min-h-[90vh] justify-center">
      <motion.div
        className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      
      {/* Avatar */}
      <motion.div className="relative group shrink-0" variants={fadeIn}>
        <div className="relative w-40 h-40 md:w-48 md:h-48">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 md:backdrop-blur-sm border border-white/20 shadow-2xl"></div>
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 p-[2px]">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                src={avatarImg}
                alt={t('hero.alt')}
                className="w-full h-full object-cover bg-blue-900"
              />
            </div>
          </div>
        </div>
        {/* Verification badge */}
        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-500 rounded-full border-2 border-bg-base z-20 flex items-center justify-center shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
      </motion.div>

      <motion.div className="text-center md:text-left flex flex-col items-center md:items-start" variants={fadeUp}>
        {/* Greeting */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-text-secondary text-lg">
            {t('hero.greeting')}{" "}
            <a href="#about" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 font-semibold hover:opacity-80 transition-opacity">
              @{t('hero.alt')}
            </a>
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-accent mb-4 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            <TypewriterText text={t('hero.title.1')} />
          </span>
          <br />
          <span className="text-text-primary text-lg sm:text-xl md:text-2xl lg:text-3xl leading-snug">
            {t('hero.title.2.2')}<br />
            {t('hero.title.2.3')}
          </span>
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-12">
          <RoleBadge label={t('hero.badge.builder')} />
          <RoleBadge label={t('hero.badge.operator')} active />
        </div>
      </motion.div>
    </motion.div>

      <motion.div
        className="text-center md:text-left flex flex-col items-center md:items-start mt-12 md:mt-16 w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Patents */}
        <motion.div className="flex flex-col items-center md:items-start mb-16" variants={fadeUp}>
          <span className="text-text-muted text-[10px] uppercase tracking-widest mb-3">{t('hero.press')}</span>
          <div className="flex flex-wrap items-center gap-6">
          <div className="px-4 py-2 rounded-lg border border-border bg-bg-pill text-xs text-text-secondary">
            <span className="font-medium text-text-primary">CN119166678A</span>
            <span className="text-text-muted ml-2">{t('hero.patent.inventor.1')}</span>
          </div>
          <div className="px-4 py-2 rounded-lg border border-border bg-bg-pill text-xs text-text-secondary">
            <span className="font-medium text-text-primary">CN120045414A</span>
            <span className="text-text-muted ml-2">{t('hero.patent.inventor.3')}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center md:items-start px-5 py-3 rounded-xl border border-border bg-bg-pill min-w-[120px]">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                {t(`hero.stat.${i}.num`)}
              </span>
              <span className="text-xs text-text-secondary mt-1">{t(`hero.stat.${i}.label`)}</span>
            </div>
          ))}
        </div>
        {/* Trust Bar */}
        <div className="text-[11px] text-text-muted uppercase tracking-[0.2em] text-center md:text-left mb-8">
          {t('hero.trust')}
        </div>
      </motion.div>

      {/* Story / Narrative Bio */}
      <motion.div className="max-w-2xl text-center md:text-left mb-12 space-y-4" variants={fadeUp}>
        <p className="text-lg text-purple-400 italic">
          {t('hero.story.lead')}
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t('hero.story.p1')}
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t('hero.story.p2')}
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div className="flex flex-wrap justify-center md:justify-start gap-4 w-full" variants={fadeUp}>
        <NavCTA href="#experience" label={t('hero.cta.path')} icon={BookOpen} />
        <NavCTA href="#projects" label={t('hero.cta.projects')} icon={GitFork} />
        <PrimaryCTA 
          label={t('hero.cta.ask')} 
          icon={MessageSquare} 
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
        />
      </motion.div>

      {/* Scroll Guidance Arrow */}
      <motion.div
        className="w-full flex justify-center md:justify-start mt-10"
        variants={fadeUp}
      >
        <button
          onClick={() => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-text-muted hover:text-accent transition-colors group cursor-pointer"
          aria-label="Scroll to experience"
        >
          <span className="text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">SCROLL</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={24} />
          </motion.div>
        </button>
      </motion.div>
      </motion.div>
    </section>
  );
};
