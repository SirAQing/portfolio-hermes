import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen } from 'lucide-react';
import { useI18n } from '../i18n';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  detailKey: string;
  title: string;
  status: string;
  tags: string[];
  link?: string;
  kbSlugs?: { slug: string; label: string }[];
}

function bulletList(text: string): string[] {
  return text.split('；').map(s => s.trim()).filter(Boolean);
}

export const ProjectModal = ({ open, onClose, detailKey, title, status, tags, link, kbSlugs }: ProjectModalProps) => {
  const { t } = useI18n();

  const background = t(`proj.${detailKey}.background`);
  const workItems = bulletList(t(`proj.${detailKey}.work`));
  const resultsItems = bulletList(t(`proj.${detailKey}.results`));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[8vh] px-4"
          >
            <div
              className="bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-sm border-b border-border-subtle px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl">
                <div className="min-w-0">
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-2 inline-block">
                    {status}
                  </span>
                  <h2 className="text-xl font-bold text-accent leading-tight">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-8">
                {/* Background */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-3">
                    {t('proj.detail.background')}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{background}</p>
                </section>

                {/* Key Contributions */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-3">
                    {t('proj.detail.work')}
                  </h3>
                  <ul className="space-y-2.5">
                    {workItems.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Impact */}
                <section>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.15em] mb-3">
                    {t('proj.detail.results')}
                  </h3>
                  <ul className="space-y-2.5">
                    {resultsItems.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Tags + Link */}
                <div className="pt-4 border-t border-border-subtle">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      {kbSlugs?.map(kb => (
                        <a
                          key={kb.slug}
                          href={`#/knowledge/${kb.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
                        >
                          <BookOpen size={12} />
                          {kb.label}
                        </a>
                      ))}
                      {link && (
                        <a
                          href={`https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                        >
                          {link} <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
