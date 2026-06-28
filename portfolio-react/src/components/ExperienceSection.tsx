import { Briefcase, Code, Brain, Database, Zap, TrendingUp, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import { SectionTitle } from './shared/SectionTitle';

const SkillTag = ({ label, desc, icon: Icon }: { label: string, desc?: string, icon?: any }) => (
  <div className="flex flex-col p-5 rounded-xl border border-border bg-bg-card hover:border-blue-500/30 hover:shadow-md transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        {Icon && <Icon size={18} className="text-blue-500" />}
      </div>
      <span className="text-sm font-semibold text-accent">{label}</span>
    </div>
    {desc && <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>}
  </div>
);

interface ExperienceCardProps {
  company: string;
  location: string;
  period: string;
  role: string;
  description: string;
  featured?: boolean;
  children?: React.ReactNode;
}

const ExperienceCard = ({ company, location, period, role, description, children }: ExperienceCardProps) => {
  return (
    <div className={`flex flex-col md:flex-row gap-6 md:gap-12 relative group`}>
      {/* Timeline connector */}
      <div className="hidden md:block absolute left-5 top-12 bottom-[-24px] w-px bg-border group-last:bg-transparent"></div>
      
      {/* Left side: Company & Logo */}
      <div className="md:w-1/3 shrink-0 pt-1 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full object-cover bg-blue-500 text-white flex items-center justify-center shrink-0 z-10 shadow-md">
          <span className="text-sm font-bold">{company.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-accent leading-tight">{company}</h3>
          <span className="text-xs text-text-muted">{location}</span>
        </div>
      </div>
      
      {/* Right side: Details */}
      <div className="md:w-2/3 pb-12 border-b border-border-subtle group-last:border-0 group-last:pb-0">
        <h4 className="text-lg font-semibold text-blue-500 mb-1">{role}</h4>
        <span className="text-xs text-text-muted font-mono mb-4 block">{period}</span>
        
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
};

export const ExperienceSection = () => {
  const { t } = useI18n();
  
  const SKILL_TAGS = [
    { label: t('exp.tag.1.title'), desc: t('exp.tag.1.desc'), icon: Code },
    { label: t('exp.tag.2.title'), desc: t('exp.tag.2.desc'), icon: Brain },
    { label: t('exp.tag.3.title'), desc: t('exp.tag.3.desc'), icon: Database },
    { label: t('exp.tag.4.title'), desc: t('exp.tag.4.desc'), icon: Zap },
    { label: t('exp.tag.5.title'), desc: t('exp.tag.5.desc'), icon: TrendingUp },
    { label: t('exp.tag.6.title'), desc: t('exp.tag.6.desc'), icon: Users }
  ];

  return (
    <section id="experience" className="py-24">
      <SectionTitle
        icon={<Briefcase size={20} className="text-blue-500" />}
        title={t('exp.title')}
        subtitle={t('exp.subtitle')}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
        {SKILL_TAGS.map(tag => <SkillTag key={tag.label} label={tag.label} desc={tag.desc} icon={tag.icon} />)}
      </div>

      <div className="space-y-0">
        <ExperienceCard
          company={t('exp.company')}
          location={t('exp.location')}
          period="2023.06 - Present"
          role={t('exp.job.1.role')}
          description={t('exp.job.1.desc')}
          featured
        >
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">ETL Platform</span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">Kettle + DolphinScheduler</span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">Docker Compose</span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-tag-bg text-tag-text font-mono">Claude Code + Codex</span>
            </div>
          </div>
        </ExperienceCard>

        <ExperienceCard
          company={t('exp.company')}
          location={t('exp.location')}
          period="2022.06 - 2023.05"
          role={t('exp.job.2.role')}
          description={t('exp.job.2.desc')}
        />
      </div>
    </section>
  );
};
