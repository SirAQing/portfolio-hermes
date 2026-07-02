import { useState } from 'react';
import { Star, GitFork, ExternalLink, Code2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { SectionTitle } from './shared/SectionTitle';
import { ProjectModal } from './ProjectModal';

// const GithubIcon = ({ size = 16 }: { size?: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
//   </svg>
// );

const StatusBadge = ({ status }: { status: string }) => {
  const lower = status.toLowerCase();
  let colorClass = 'bg-white/5 text-text-secondary';
  if (lower.includes('enterprise') || lower.includes('企业')) colorClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
  else if (lower.includes('production') || lower.includes('生产')) colorClass = 'bg-badge-blue text-badge-blue-t';
  else if (lower.includes('personal') || lower.includes('个人')) colorClass = 'bg-badge-green text-badge-green-t';
  else if (lower.includes('open source') || lower.includes('开源')) colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
  else if (lower.includes('live') || lower.includes('上线')) colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';

  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium ${colorClass} mb-3 inline-block`}>
      {status}
    </span>
  );
};

interface ProjectCardProps {
  detailKey: string;
  title: string;
  status: string;
  description: string;
  tags: string[];
  stars?: string;
  forks?: string;
  link?: string;
  kbSlugs?: { slug: string; label: string }[];
  onOpen: () => void;
}

const ProjectCard = ({ title, status, description, tags, stars, forks, link, onOpen }: ProjectCardProps) => {
  return (
    <div
      onClick={onOpen}
      className="bg-bg-card border border-border rounded-xl p-6 hover:bg-bg-card-hover hover:border-blue-500/20 transition-all flex flex-col h-full group cursor-pointer"
    >
      <StatusBadge status={status} />
      <h3 className="text-lg font-semibold text-accent mb-2 flex items-center gap-2">
        {title}
        {link && <ExternalLink size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />}
      </h3>
      <p className="text-sm text-text-secondary mb-4 flex-grow">{description}</p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">
            {tag}
          </span>
        ))}
      </div>

      {(stars || forks || link) && (
        <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted mt-auto">
          <div className="flex items-center gap-4">
            {stars && <span className="flex items-center gap-1"><Star size={12} className="text-star-color" /> {stars}</span>}
            {forks && <span className="flex items-center gap-1"><GitFork size={12} /> {forks}</span>}
          </div>
          {link && <span className="hover:text-text-primary transition-colors">{link}</span>}
        </div>
      )}
    </div>
  );
};

// const AgentInfraCard = () => {
//   const { t } = useI18n();
//   return (
//   <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
//     <div className="flex justify-between items-start mb-4">
//       <h3 className="text-lg font-semibold text-accent">{t('proj.infra.title')}</h3>
//       <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium bg-white/5 text-text-muted border border-border">{t('proj.infra.private')}</span>
//     </div>
//     <p className="text-sm text-text-secondary italic mb-6">{t('proj.infra.quote')}</p>
//     
//     <div className="flex flex-col items-center">
//       <div className="px-4 py-2 bg-tag-bg border border-border rounded-md text-sm font-mono text-accent mb-4">
//         {t('proj.infra.orchestrator')}
//       </div>
//       <div className="flex flex-wrap justify-center gap-2 w-full max-w-lg mx-auto">
//         {['brand', 'venture', 'career', 'community', 'portfolio'].map(op => (
//           <div key={op} className="flex-1 min-w-[80px] text-center p-2 border border-border-subtle rounded bg-[#0a0a0a]">
//             <div className="text-xs text-text-secondary font-mono">{op} ops</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// )};

export const ProjectsSection = () => {
  const { t } = useI18n();
  const [modal, setModal] = useState<ProjectCardProps | null>(null);

  const PROJECTS: ProjectCardProps[] = [
    {
      detailKey: 'etl',
      title: t('proj.etl.title'),
      status: t('proj.status.enterprise'),
      description: t('proj.etl.desc'),
      tags: ["Kettle", "DolphinScheduler", "MySQL", "Docker Compose", "Python", "Shell"],
      onOpen: () => {},
    },
    {
      detailKey: 'report',
      title: t('proj.report.title'),
      status: t('proj.status.enterprise'),
      description: t('proj.report.desc'),
      tags: ["VBA", "Excel", "ADO", "MySQL", "Data Pipeline"],
      onOpen: () => {},
    },
    {
      detailKey: 'llm',
      title: t('proj.llm.title'),
      status: t('proj.status.enterprise'),
      description: t('proj.llm.desc'),
      tags: ["Ollama", "Dify", "RAG", "Docker", "Linux", "Chatflow"],
      kbSlugs: [
        { slug: 'linux-deploy-ollama', label: 'Ollama 部署方案' },
        { slug: 'linux-deploy-dify-ollama', label: 'Dify 部署方案' },
      ],
      onOpen: () => {},
    },
    {
      detailKey: 'nl2sql',
      title: t('proj.nl2sql.title'),
      status: t('proj.status.personal'),
      description: t('proj.nl2sql.desc'),
      tags: ["FastAPI", "LangGraph", "ChromaDB", "Gradio", "Docker", "HuggingFace"],
      link: "gitee.com/da-qing-oh/nl2-sql-agent",
      onOpen: () => {},
    },
    {
      detailKey: 'portfolio',
      title: t('proj.portfolio.title'),
      status: t('proj.status.live'),
      description: t('proj.portfolio.desc'),
      tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "FastAPI", "SQLite", "SSE"],
      link: "github.com/SirAQing/minimalist-portfolio",
      onOpen: () => {},
    },
    {
      detailKey: 'wechat',
      title: t('proj.wechat.title'),
      status: t('proj.status.opensource'),
      description: t('proj.wechat.desc'),
      tags: ["JavaScript", "Chrome Extension", "Manifest V3", "DOM Injection", "Markdown"],
      link: "github.com/SirAQing/wechat-formatter",
      onOpen: () => {},
    },
  ];

  return (
    <section id="projects" className="py-24">
      <SectionTitle
        icon={<Code2 size={20} className="text-blue-500" />}
        title={t('proj.title')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {PROJECTS.map(p => (
          <ProjectCard key={p.detailKey} {...p} onOpen={() => setModal(p)} />
        ))}
      </div>

      {modal && (
        <ProjectModal
          open={!!modal}
          onClose={() => setModal(null)}
          detailKey={modal.detailKey}
          title={modal.title}
          status={modal.status}
          tags={modal.tags}
          link={modal.link}
          kbSlugs={modal.kbSlugs}
        />
      )}
    </section>
  );
};
