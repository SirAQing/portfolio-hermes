import { GraduationCap, Award, Wrench } from 'lucide-react';
import { useI18n } from '../i18n';
import { SectionTitle } from './shared/SectionTitle';

const EduCard = ({ year, org, degree, note }: { year: string, org: string, degree: string, note?: string }) => (
  <div className="flex gap-4 group mb-6">
    <div className="text-xs font-mono text-text-muted pt-1 w-20 shrink-0">{year}</div>
    <div className="flex-1 pb-6 border-b border-border-subtle group-last:border-0 group-last:pb-0">
      <h4 className="text-base font-medium text-accent mb-1 flex items-center gap-2">
        {degree}
        {note && <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">{note}</span>}
      </h4>
      <p className="text-sm text-text-secondary">{org}</p>
    </div>
  </div>
);

export const EducationSection = () => {
  const { t } = useI18n();
  return (
  <section id="education" className="py-24">
    <SectionTitle
      icon={<GraduationCap size={20} className="text-blue-500" />}
      title={t('edu.title')}
    />
    <div className="space-y-2">
      <EduCard year={t('edu.1.year')} org={t('edu.1.org')} degree={t('edu.1.degree')} note={t('edu.1.note')} />
    </div>
  </section>
)};

export const CertificationsSection = () => {
  const { t } = useI18n();
  const PATENTS = [
    { name: t('cert.patent.1.name'), issuer: t('cert.patent.1.issuer'), year: t('cert.patent.1.status'), url: "#" },
    { name: t('cert.patent.2.name'), issuer: t('cert.patent.2.issuer'), year: t('cert.patent.2.status'), url: "#" }
  ];
  return (
  <section className="py-24">
    <SectionTitle 
      icon={<Award size={20} className="text-blue-500" />}
      title={t('cert.title')} 
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {PATENTS.map(patent => (
        <div key={patent.name} className="flex justify-between items-center bg-bg-card border border-border rounded-xl px-5 py-4 hover:bg-bg-card-hover hover:border-white/20 transition-all group">
          <div>
            <div className="text-sm font-medium text-accent group-hover:text-white transition-colors">{patent.name}</div>
            <div className="text-xs text-text-muted mt-1">{patent.issuer}</div>
          </div>
          <span className="text-xs text-text-muted font-mono">{patent.year}</span>
        </div>
      ))}
    </div>
  </section>
)};

const StackGroup = ({ label, items }: { label: string, items: string[] }) => (
  <div className="mb-6">
    <h4 className="text-sm font-medium text-text-secondary mb-3">{label}</h4>
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="px-2.5 py-1 text-xs rounded-md bg-tag-bg text-tag-text font-mono border border-border/50">
          {item}
        </span>
      ))}
    </div>
  </div>
);

export const SkillsSection = () => {
  const { t } = useI18n();
  return (
  <section id="skills" className="py-24">
    <SectionTitle
      icon={<Wrench size={20} className="text-blue-500" />}
      title={t('skills.title')}
    />
    
    <div className="mb-12">
      <h3 className="text-lg font-semibold text-accent mb-6">{t('skills.lang')}</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <div className="flex justify-between text-sm mb-1"><span className="text-text-primary">{t('skills.lang.es')}</span><span className="text-text-muted">{t('skills.lang.es.level')}</span></div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-accent w-full rounded-full"></div></div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span className="text-text-primary">{t('skills.lang.en')}</span><span className="text-text-muted">{t('skills.lang.en.level')}</span></div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-accent w-[50%] rounded-full"></div></div>
        </div>
      </div>
    </div>

    <div className="mb-12">
      <h3 className="text-lg font-semibold text-accent mb-6">{t('skills.soft')}</h3>
      <div className="flex flex-wrap gap-2">
        {[
          t('skills.soft.1'), t('skills.soft.2'), t('skills.soft.3'), 
          t('skills.soft.4'), t('skills.soft.5'), t('skills.soft.6'), t('skills.soft.7')
        ].map(tag => (
          <span key={tag} className="px-3 py-1.5 text-sm rounded-full bg-white/5 text-text-primary border border-white/10">
            {tag}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-accent mb-6">{t('skills.tech')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <StackGroup label="ETL & Data Integration" items={["Kettle", "DolphinScheduler", "Data Cleaning", "Scheduling", "Data Quality"]} />
          <StackGroup label="Programming" items={["Python (Pandas / NumPy / FastAPI)", "VBA", "Shell"]} />
          <StackGroup label="Database" items={["MySQL", "SQLite"]} />
          <StackGroup label="System Integration" items={["LIMS / LMS", "ADO DB", "HTTP API"]} />
        </div>
        <div>
          <StackGroup label="AI Application" items={["Ollama", "Dify", "RAG", "Chatflow", "Workflow", "FastAPI", "LangGraph", "ChromaDB", "HuggingFace Embedding", "Gradio"]} />
          <StackGroup label="DevOps & Deploy" items={["Linux (CentOS / Ubuntu)", "Docker", "Docker Compose"]} />
          <StackGroup label="AI Coding Workflow" items={["Claude Code", "Codex", "Hermes Agent", "GitHub Copilot"]} />
        </div>
      </div>
    </div>
  </section>
)};
