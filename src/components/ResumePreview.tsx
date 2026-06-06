import { forwardRef, memo, type CSSProperties } from 'react';
import type { ResumeData } from '../types';
import { formatRange, formatDate } from '../lib/format';
import { getTemplate, type Template, type SectionStyle, type FontFamily } from '../lib/templateEngine';
import { getCustomization, resolveFontStack, pageWidthIn, pageHeightIn, formatCustomRange, formatCustomDate, nameSizePt } from '../lib/customization';

interface Props {
  resume: ResumeData;
  variant?: 'ats' | 'visual';
}

const ResumePreviewInner = forwardRef<HTMLDivElement, Props>(({ resume, variant = 'visual' }, ref) => {
  const template = getTemplate(resume.templateId);
  const isAts = variant === 'ats';
  const c = getCustomization(resume);

  // CSS variables that every layout's inline styles can pick up.
  // Doing it via CSS vars means we don't need to refactor every layout component.
  const cssVars: CSSProperties = isAts ? {
    // ATS variant ignores user-chosen colors/fonts to guarantee parseability.
    ['--cv-accent' as string]: '#000000',
    ['--cv-text' as string]: '#000000',
    ['--cv-font-family' as string]: 'Arial, Helvetica, sans-serif',
    ['--cv-font-size' as string]: '11pt',
    ['--cv-line-height' as string]: '1.4',
    ['--cv-name-size' as string]: '22pt',
    ['--cv-heading-size' as string]: '12pt',
    ['--cv-padding' as string]: '0.6in',
    ['--cv-entry-gap' as string]: '12px',
  } : {
    ['--cv-accent' as string]: c.accentColor,
    ['--cv-text' as string]: c.primaryColor,
    ['--cv-font-family' as string]: resolveFontStack(c.fontFamily, c.fontCategory),
    ['--cv-font-size' as string]: `${c.fontSize}pt`,
    ['--cv-line-height' as string]: String(c.lineHeight),
    ['--cv-name-size' as string]: `${nameSizePt(c)}pt`,
    ['--cv-heading-size' as string]: `${c.subtitleSize}pt`,
    ['--cv-padding' as string]: `${c.marginTopBottom}mm ${c.marginLeftRight}mm`,
    ['--cv-entry-gap' as string]: `${Math.max(2, 12 + c.spaceBetweenEntries)}px`,
    ['--cv-heading-transform' as string]: c.headingCapitalization === 'uppercase' ? 'uppercase' : c.headingCapitalization === 'capitalize' ? 'capitalize' : 'none',
    ['--cv-name-weight' as string]: c.nameBold ? '800' : '500',
  };

  // Page size — affects width via CSS class hook
  const pageStyle: CSSProperties = {
    ...cssVars,
    width: `${pageWidthIn(c.pageFormat)}in`,
    minHeight: `${pageHeightIn(c.pageFormat)}in`,
  };

  const wrapperProps = { 'data-variant': variant, 'data-accent-name': c.accentTargets.name ? 'true' : 'false', 'data-accent-job': c.accentTargets.jobTitle ? 'true' : 'false', 'data-accent-heading': c.accentTargets.headings ? 'true' : 'false', 'data-accent-line': c.accentTargets.headingLine ? 'true' : 'false', 'data-accent-dates': c.accentTargets.dates ? 'true' : 'false' };

  // Render the matching layout with shared CSS variables applied to a wrapping div.
  const layoutEl = (() => {
    if (isAts) return <AtsLayout resume={resume} />;
    switch (template.layout) {
      case 'sidebar-left':       return <SidebarLayout resume={resume} template={template} side="left" />;
      case 'sidebar-right':      return <SidebarLayout resume={resume} template={template} side="right" />;
      case 'centered':           return <CenteredLayout resume={resume} template={template} />;
      case 'header-card':        return <HeaderCardLayout resume={resume} template={template} />;
      case 'split-header':       return <SplitHeaderLayout resume={resume} template={template} />;
      case 'monogram':           return <MonogramLayout resume={resume} template={template} />;
      case 'timeline':           return <TimelineLayout resume={resume} template={template} />;
      case 'accent-strip-left':  return <AccentStripLayout resume={resume} template={template} />;
      case 'accent-strip-top':   return <TopBarLayout resume={resume} template={template} />;
      case 'magazine':           return <MagazineLayout resume={resume} template={template} />;
      case 'card-stack':         return <CardStackLayout resume={resume} template={template} />;
      case 'hybrid-header-side': return <HybridLayout resume={resume} template={template} />;
      case 'compact-ats':        return <CompactAtsLayout resume={resume} template={template} />;
      case 'executive-banner':   return <ExecutiveBannerLayout resume={resume} template={template} />;
      case 'single':
      default:                   return <SingleLayout resume={resume} template={template} />;
    }
  })();

  return (
    <div
      ref={ref}
      className="cv-root"
      style={pageStyle}
      {...wrapperProps}
    >
      {layoutEl}
    </div>
  );
});

ResumePreviewInner.displayName = 'ResumePreviewInner';

const ResumePreview = memo(ResumePreviewInner);
export default ResumePreview;

/* ============== shared helpers consumed by layouts ============== */

/** Format a date range using the resume's customization (falls back to country format). */
function rangeFor(resume: ResumeData, start: string, end: string): string {
  if (resume.customization) return formatCustomRange(start, end, resume.customization.dateFormat);
  return formatRange(start, end, resume.country);
}

function dateFor(resume: ResumeData, date: string): string {
  if (resume.customization) return formatCustomDate(date, resume.customization.dateFormat);
  return formatDate(date, resume.country);
}

/* ================================================================
   STYLE HELPERS
================================================================ */

function fontFamilyFor(font: FontFamily | undefined): string {
  switch (font) {
    case 'serif-executive':  return '"Georgia", "Cambria", serif';
    case 'serif-editorial':  return '"Source Serif Pro", "Cambria", "Georgia", serif';
    case 'display-bold':     return '"Inter", "Helvetica Neue", Arial, sans-serif';
    case 'mono-accent':      return '"Inter", "Helvetica Neue", Arial, sans-serif';
    case 'sans-clean':       return '"Helvetica Neue", Arial, sans-serif';
    case 'sans-modern':
    default:                 return '"Inter", "Helvetica Neue", Arial, sans-serif';
  }
}

function headingFontFor(font: FontFamily | undefined): string {
  if (font === 'mono-accent') return '"SFMono-Regular", "Menlo", "Consolas", monospace';
  if (font === 'display-bold') return '"Inter", "Helvetica Neue", sans-serif';
  return fontFamilyFor(font);
}

function gradient(t: Template): string {
  return t.theme.secondary
    ? `linear-gradient(135deg, ${t.theme.primary} 0%, ${t.theme.secondary} 100%)`
    : t.theme.primary;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'CV';
}

/* ================================================================
   SHARED PIECES
================================================================ */

function ContactLine({ resume, separator = '·', className = '' }: { resume: ResumeData; separator?: string; className?: string }) {
  const items = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.portfolio,
  ].filter(Boolean);
  return (
    <div className={`text-[10pt] flex flex-wrap gap-x-2 gap-y-0.5 ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="opacity-50" aria-hidden>{separator}</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

function ExperienceList({ resume, accent, dotted = false }: { resume: ResumeData; accent: string; dotted?: boolean }) {
  const c = resume.customization;
  const dateColor = c?.accentTargets.dates ? 'var(--cv-accent)' : undefined;
  const subColor = c?.accentTargets.subtitle ? 'var(--cv-accent)' : accent;
  return (
    <>
      {resume.experience.map((e) => (
        <div key={e.id} className="relative" style={{ marginBottom: 'var(--cv-entry-gap, 12px)' }}>
          {dotted && <span className="absolute -left-[14px] top-[6px] w-2 h-2 rounded-full" style={{ background: accent }} />}
          <div className="flex justify-between items-baseline gap-2">
            <div className="font-semibold">{e.title}</div>
            <div className="text-[10pt] text-slate-600 shrink-0" style={dateColor ? { color: dateColor } : undefined}>
              {rangeFor(resume, e.startDate, e.endDate)}
            </div>
          </div>
          <div className="text-[10.5pt] italic" style={{ color: subColor }}>
            {e.company}{e.location ? ` — ${e.location}` : ''}
          </div>
          {e.bullets.length > 0 && (
            <ul className="list-disc ml-5 mt-1">
              {e.bullets.map((b, i) => <li key={i} className="leading-snug">{b}</li>)}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

function EducationList({ resume, accent }: { resume: ResumeData; accent: string }) {
  const c = resume.customization;
  const dateColor = c?.accentTargets.dates ? 'var(--cv-accent)' : undefined;
  const subColor = c?.accentTargets.subtitle ? 'var(--cv-accent)' : accent;
  return (
    <>
      {resume.education.map((e) => (
        <div key={e.id} className="mb-2">
          <div className="flex justify-between gap-2">
            <div className="font-semibold">{e.degree}</div>
            <div className="text-[10pt] text-slate-600 shrink-0" style={dateColor ? { color: dateColor } : undefined}>
              {rangeFor(resume, e.startDate, e.endDate)}
            </div>
          </div>
          <div className="text-[10.5pt]" style={{ color: subColor }}>
            {e.school}{e.location ? `, ${e.location}` : ''}{e.gpa ? ` — GPA: ${e.gpa}` : ''}
          </div>
        </div>
      ))}
    </>
  );
}

function ProjectsList({ resume }: { resume: ResumeData }) {
  return (
    <>
      {resume.projects.map((p) => (
        <div key={p.id} className="mb-1.5">
          <div className="font-semibold">
            {p.name}{p.tech && <span className="font-normal italic text-[10pt]"> ({p.tech})</span>}
          </div>
          {p.description && <div>{p.description}{p.link && ` — ${p.link}`}</div>}
        </div>
      ))}
    </>
  );
}

function CertList({ resume }: { resume: ResumeData }) {
  const dateColor = resume.customization?.accentTargets.dates ? 'var(--cv-accent)' : undefined;
  return (
    <>
      {resume.certifications.map((c) => (
        <div key={c.id} className="flex justify-between gap-2">
          <span>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
          <span className="text-[10pt] text-slate-600 shrink-0" style={dateColor ? { color: dateColor } : undefined}>{dateFor(resume, c.date)}</span>
        </div>
      ))}
    </>
  );
}

function SkillsList({ resume }: { resume: ResumeData }) {
  return (
    <>
      {resume.skills.technical.length > 0 && (
        <div className="mb-1"><span className="font-semibold">Technical Skills: </span>{resume.skills.technical.join(', ')}</div>
      )}
      {resume.skills.tools.length > 0 && (
        <div className="mb-1"><span className="font-semibold">Tools: </span>{resume.skills.tools.join(', ')}</div>
      )}
      {resume.skills.soft.length > 0 && (
        <div className="mb-1"><span className="font-semibold">Soft Skills: </span>{resume.skills.soft.join(', ')}</div>
      )}
      {resume.skills.languages.length > 0 && (
        <div className="mb-1"><span className="font-semibold">Languages: </span>{resume.skills.languages.join(', ')}</div>
      )}
    </>
  );
}

/* Section heading flavors */
function SectionTitle({ title, accent, style = 'underline', font, index }: { title: string; accent: string; style?: SectionStyle; font?: FontFamily; index?: number }) {
  const ff = headingFontFor(font);
  const base = 'font-bold tracking-wider';
  // Use CSS variables for heading size + capitalization so customization applies live.
  const styleSp: React.CSSProperties = {
    fontFamily: ff,
    fontSize: 'var(--cv-heading-size, 12pt)',
    textTransform: 'var(--cv-heading-transform, uppercase)' as React.CSSProperties['textTransform'],
  };

  if (style === 'bar') {
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-sm" style={{ background: accent }} />
        <h2 className={base} style={{ ...styleSp, color: accent }}>{title}</h2>
      </div>
    );
  }
  if (style === 'plain') {
    return <h2 className={`${base} mb-1.5`} style={{ ...styleSp, color: accent }}>{title}</h2>;
  }
  if (style === 'double') {
    return (
      <div className="mb-2">
        <h2 className={`${base} text-center`} style={{ ...styleSp, color: accent, letterSpacing: '0.2em' }}>{title}</h2>
        <div className="flex justify-center mt-1 gap-1.5">
          <div className="h-px w-12" style={{ background: accent }} />
          <div className="w-1 h-1 rotate-45" style={{ background: accent }} />
          <div className="h-px w-12" style={{ background: accent }} />
        </div>
      </div>
    );
  }
  if (style === 'pill') {
    return (
      <h2 className="inline-block text-[10pt] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white mb-2" style={{ ...styleSp, background: accent }}>
        {title}
      </h2>
    );
  }
  if (style === 'boxed') {
    return (
      <h2 className={`${base} mb-2 inline-block px-2 py-0.5 border-2`} style={{ ...styleSp, color: accent, borderColor: accent }}>{title}</h2>
    );
  }
  if (style === 'numbered') {
    return (
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[14pt] font-extrabold tabular-nums" style={{ color: accent, fontFamily: ff }}>
          {String((index || 0) + 1).padStart(2, '0')}
        </span>
        <h2 className={base} style={{ ...styleSp, color: accent }}>{title}</h2>
      </div>
    );
  }
  if (style === 'left-rule') {
    return (
      <div className="flex items-center gap-3 mb-2">
        <h2 className={base} style={{ ...styleSp, color: accent }}>{title}</h2>
        <div className="flex-1 h-px" style={{ background: accent, opacity: 0.4 }} />
      </div>
    );
  }
  // underline (default)
  return (
    <h2 className={`${base} border-b-2 pb-0.5 mb-1.5`} style={{ ...styleSp, color: accent, borderColor: accent }}>
      {title}
    </h2>
  );
}

function Section({ title, accent, style, font, children, index }: { title: string; accent: string; style?: SectionStyle; font?: FontFamily; children: React.ReactNode; index?: number }) {
  return (
    <section className="mb-3">
      <SectionTitle title={title} accent={accent} style={style} font={font} index={index} />
      <div className="text-[11pt]">{children}</div>
    </section>
  );
}

/* Header renderer per headerStyle */
function Header({ template, resume, sectionAccent }: { template: Template; resume: ResumeData; sectionAccent?: string }) {
  const c = resume.customization;
  const baseAccent = sectionAccent || template.theme.primary;
  const accent = c?.accentTargets.name ? 'var(--cv-accent)' : baseAccent;
  const jobAccent = c?.accentTargets.jobTitle ? 'var(--cv-accent)' : '#475569';
  const ff = c ? 'var(--cv-font-family)' : fontFamilyFor(template.font);
  const align = c?.headerAlignment || 'left';
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';
  const contactAlignClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : '';
  const photo = c?.profilePhoto;
  const photoShape = c?.profilePhotoShape || 'circle';
  // If a profile photo exists, render a flex row with the photo
  const wrapHeaderWithPhoto = (content: React.ReactNode) => photo ? (
    <div className="mb-4 flex items-center gap-4">
      <img
        src={photo}
        alt="Profile"
        className={`w-20 h-20 object-cover shrink-0 ${photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-md'}`}
      />
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  ) : <div className={alignClass}>{content}</div>;

  const nameFontSize = c ? 'var(--cv-name-size)' : '24pt';
  const nameWeight = c ? 'var(--cv-name-weight)' : '700';

  switch (template.headerStyle) {
    case 'mega':
      return (
        <header className="mb-4">
          <div className="text-[8pt] uppercase tracking-[0.4em] text-slate-500">— Curriculum Vitæ —</div>
          <h1 className="text-[40pt] font-extrabold leading-none tracking-tight mt-1" style={{ color: accent, fontFamily: ff }}>{resume.contact.fullName || 'Your Name'}</h1>
          <div className="border-t-4 mt-2 pt-2 flex items-end justify-between" style={{ borderColor: accent }}>
            {resume.targetJobTitle && <p className="text-[12pt] font-semibold italic">{resume.targetJobTitle}</p>}
            <ContactLine resume={resume} className="text-slate-700" />
          </div>
        </header>
      );
    case 'minimal':
      return (
        <header className="mb-4">
          <div className="text-[8pt] uppercase tracking-[0.4em] text-slate-500">{resume.targetJobTitle || 'Professional'}</div>
          <h1 className="text-[28pt] font-bold leading-none" style={{ color: accent, fontFamily: ff }}>{resume.contact.fullName || 'Your Name'}</h1>
          <ContactLine resume={resume} className="text-slate-700 mt-2" />
        </header>
      );
    case 'boxed':
      return (
        <header className="mb-4 border-2 rounded-md p-3" style={{ borderColor: accent }}>
          <h1 className="text-[24pt] font-bold" style={{ color: accent, fontFamily: ff }}>{resume.contact.fullName || 'Your Name'}</h1>
          {resume.targetJobTitle && <p className="text-[12pt] text-slate-700">{resume.targetJobTitle}</p>}
          <ContactLine resume={resume} className="text-slate-700 mt-1" />
        </header>
      );
    case 'tag':
      return (
        <header className="mb-4">
          <h1 className="text-[26pt] font-bold leading-tight" style={{ color: accent, fontFamily: ff }}>{resume.contact.fullName || 'Your Name'}</h1>
          {resume.targetJobTitle && <span className="inline-block mt-1 text-[10pt] font-semibold uppercase tracking-widest text-white px-2 py-0.5 rounded" style={{ background: accent }}>{resume.targetJobTitle}</span>}
          <ContactLine resume={resume} className="text-slate-700 mt-2" />
        </header>
      );
    case 'banner':
      return (
        <header className="mb-4 border-b-4 pb-2" style={{ borderColor: accent }}>
          <h1 className="text-[26pt] font-extrabold leading-tight" style={{ color: accent, fontFamily: ff }}>{resume.contact.fullName || 'Your Name'}</h1>
          {resume.targetJobTitle && <p className="text-[12pt] text-slate-700">{resume.targetJobTitle}</p>}
          <ContactLine resume={resume} className="text-slate-700 mt-1" />
        </header>
      );
    case 'classic':
    default:
      return wrapHeaderWithPhoto(
        <>
          <h1 className="leading-tight" style={{ color: accent, fontFamily: ff, fontSize: nameFontSize, fontWeight: nameWeight }}>
            {resume.contact.fullName || 'Your Name'}
          </h1>
          {resume.targetJobTitle && <p className="text-[12pt]" style={{ color: jobAccent }}>{resume.targetJobTitle}</p>}
          <ContactLine resume={resume} className={`text-slate-700 mt-1 ${contactAlignClass}`} />
        </>
      );
  }
}

/* ================================================================
   ATS LAYOUT — Plain, single column, Arial
================================================================ */

const AtsLayout = forwardRef<HTMLDivElement, { resume: ResumeData }>(({ resume }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif', padding: '0.6in', fontSize: '11pt', lineHeight: 1.4 }}>
    <header className="mb-3">
      <h1 className="text-[22pt] font-bold leading-tight text-black">{resume.contact.fullName || 'Your Name'}</h1>
      {/* ATS-safe ASCII pipe separator (no Unicode chars in ATS export) */}
      <ContactLine resume={resume} separator="|" className="text-black" />
    </header>
    <Section title="Professional Summary" accent="#000" style="underline"><p className="leading-snug">{resume.summary || 'Your professional summary will appear here.'}</p></Section>
    <Section title="Work Experience" accent="#000" style="underline"><ExperienceList resume={resume} accent="#000" /></Section>
    <Section title="Education" accent="#000" style="underline"><EducationList resume={resume} accent="#000" /></Section>
    <Section title="Skills" accent="#000" style="underline"><SkillsList resume={resume} /></Section>
    {resume.projects.length > 0 && <Section title="Projects" accent="#000" style="underline"><ProjectsList resume={resume} /></Section>}
    {resume.certifications.length > 0 && <Section title="Certifications" accent="#000" style="underline"><CertList resume={resume} /></Section>}
  </div>
));
AtsLayout.displayName = 'AtsLayout';

/* ================================================================
   GENERIC BODY (sections list)
================================================================ */

function Body({ template, resume }: { template: Template; resume: ResumeData }) {
  // Use customization to override accent, section style, ordering, visibility
  const c = resume.customization;
  const accent = c?.accentTargets.headings ? c.accentColor : (c ? c.primaryColor : template.theme.primary);
  const st = (c?.headingStyle ?? template.sectionStyle) as SectionStyle;
  const f = template.font;

  // Default order
  const defaultOrder = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
  const order = resume.sectionOrder && resume.sectionOrder.length > 0 ? resume.sectionOrder : defaultOrder;
  const hidden = new Set(resume.hiddenSections || []);

  const renderers: Record<string, (idx: number) => React.ReactNode> = {
    summary: (idx) =>
      resume.summary && <Section key="summary" title="Professional Summary" accent={accent} style={st} font={f} index={idx}><p className="leading-snug">{resume.summary}</p></Section>,
    experience: (idx) =>
      resume.experience.length > 0 && <Section key="experience" title="Work Experience" accent={accent} style={st} font={f} index={idx}><ExperienceList resume={resume} accent={accent} /></Section>,
    education: (idx) =>
      resume.education.length > 0 && <Section key="education" title="Education" accent={accent} style={st} font={f} index={idx}><EducationList resume={resume} accent={accent} /></Section>,
    skills: (idx) =>
      (resume.skills.technical.length + resume.skills.tools.length + resume.skills.soft.length + resume.skills.languages.length) > 0 &&
      <Section key="skills" title="Skills" accent={accent} style={st} font={f} index={idx}><SkillsList resume={resume} /></Section>,
    projects: (idx) =>
      resume.projects.length > 0 && <Section key="projects" title="Projects" accent={accent} style={st} font={f} index={idx}><ProjectsList resume={resume} /></Section>,
    certifications: (idx) =>
      resume.certifications.length > 0 && <Section key="certifications" title="Certifications" accent={accent} style={st} font={f} index={idx}><CertList resume={resume} /></Section>,
    languages: (idx) =>
      resume.skills.languages.length > 0 && <Section key="languages" title="Languages" accent={accent} style={st} font={f} index={idx}><div>{resume.skills.languages.join(', ')}</div></Section>,
  };

  return <>{order.filter((k) => !hidden.has(k)).map((k, i) => renderers[k]?.(i))}</>;
}

/* ================================================================
   1. SINGLE COLUMN
================================================================ */

function SingleLayout({ resume, template }: { resume: ResumeData; template: Template }) {
  return (
    <div className="resume-paper bg-white text-slate-900" style={{ fontFamily: 'var(--cv-font-family)', padding: 'var(--cv-padding)', fontSize: 'var(--cv-font-size)', lineHeight: 'var(--cv-line-height)' }}>
      <Header template={template} resume={resume} />
      <Body template={template} resume={resume} />
    </div>
  );
}

/* ================================================================
   2. COMPACT ATS (denser)
================================================================ */

function CompactAtsLayout({ resume, template }: { resume: ResumeData; template: Template }) {
  const c = resume.customization;
  const nameColor = c?.accentTargets.name ? 'var(--cv-accent)' : template.theme.primary;
  return (
    <div className="resume-paper bg-white text-slate-900" style={{ fontFamily: 'var(--cv-font-family)', padding: 'var(--cv-padding)', fontSize: 'var(--cv-font-size)', lineHeight: 'var(--cv-line-height)' }}>
      <header className="mb-2">
        <h1 className="leading-tight" style={{ fontSize: 'var(--cv-name-size)', fontWeight: 'var(--cv-name-weight)', color: nameColor }}>{resume.contact.fullName || 'Your Name'}</h1>
        <ContactLine resume={resume} className="text-slate-700" />
      </header>
      <Body template={template} resume={resume} />
    </div>
  );
}

/* ================================================================
   3. CENTERED
================================================================ */

function CenteredLayout({ resume, template }: { resume: ResumeData; template: Template }) {
  const c = resume.customization;
  const nameColor = c?.accentTargets.name ? 'var(--cv-accent)' : template.theme.primary;
  const jobColor = c?.accentTargets.jobTitle ? 'var(--cv-accent)' : '#475569';
  return (
    <div className="resume-paper bg-white text-slate-900" style={{ fontFamily: 'var(--cv-font-family)', padding: 'var(--cv-padding)', fontSize: 'var(--cv-font-size)', lineHeight: 'var(--cv-line-height)' }}>
      <header className="mb-5 text-center">
        <h1 className="leading-tight tracking-wide" style={{ fontSize: 'var(--cv-name-size)', fontWeight: 'var(--cv-name-weight)', color: nameColor }}>
          {resume.contact.fullName || 'Your Name'}
        </h1>
        {template.theme.secondary
          ? <div className="flex items-center justify-center gap-1 my-1"><div className="h-px w-16" style={{ background: template.theme.secondary }} /><div className="w-1 h-1 rounded-full" style={{ background: template.theme.secondary }} /><div className="h-px w-16" style={{ background: template.theme.secondary }} /></div>
          : <div className="h-px w-32 mx-auto mt-1 mb-2" style={{ background: template.theme.primary }} />}
        {resume.targetJobTitle && <p className="text-[12pt] italic mb-1" style={{ color: jobColor }}>{resume.targetJobTitle}</p>}
        <ContactLine resume={resume} className="justify-center text-slate-700" />
      </header>
      <Body template={template} resume={resume} />
    </div>
  );
}

/* ================================================================
   4. EXECUTIVE BANNER
================================================================ */

const ExecutiveBannerLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), fontSize: '11pt', lineHeight: 1.45 }}>
    <div className="text-white text-center" style={{ background: gradient(template), padding: '0.5in 0.6in' }}>
      <h1 className="text-[36pt] font-extrabold leading-none tracking-tight">{resume.contact.fullName || 'Your Name'}</h1>
      {resume.targetJobTitle && <p className="text-[13pt] mt-2 opacity-95 tracking-widest uppercase">{resume.targetJobTitle}</p>}
      <div className="h-px w-32 mx-auto mt-3 mb-3 opacity-50 bg-white" />
      <ContactLine resume={resume} className="justify-center text-white" />
    </div>
    <div style={{ padding: '0.45in 0.6in' }}>
      <Body template={template} resume={resume} />
    </div>
  </div>
));
ExecutiveBannerLayout.displayName = 'ExecutiveBannerLayout';

/* ================================================================
   5. SIDEBAR (left or right)
================================================================ */

const SidebarLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template; side: 'left' | 'right' }>(({ resume, template, side }, ref) => {
  const sidebarStyle = { background: gradient(template), color: template.theme.textOnPrimary };
  const Sidebar = (
    <aside className="p-6 text-[10pt]" style={sidebarStyle}>
      <h1 className="text-[20pt] font-bold leading-tight mb-1">{resume.contact.fullName || 'Your Name'}</h1>
      {resume.targetJobTitle && <p className="text-[10pt] uppercase tracking-widest opacity-90 mb-4">{resume.targetJobTitle}</p>}
      <SidebarBlock title="Contact">
        {resume.contact.email && <div className="break-words">✉ {resume.contact.email}</div>}
        {resume.contact.phone && <div>☎ {resume.contact.phone}</div>}
        {resume.contact.location && <div>📍 {resume.contact.location}</div>}
        {resume.contact.linkedin && <div className="break-words">in {resume.contact.linkedin}</div>}
        {resume.contact.github && <div className="break-words">⌘ {resume.contact.github}</div>}
        {resume.contact.portfolio && <div className="break-words">🌐 {resume.contact.portfolio}</div>}
      </SidebarBlock>
      {resume.skills.technical.length > 0 && <SidebarBlock title="Skills">{resume.skills.technical.map((s) => <div key={s}>• {s}</div>)}</SidebarBlock>}
      {resume.skills.tools.length > 0 && <SidebarBlock title="Tools">{resume.skills.tools.map((s) => <div key={s}>• {s}</div>)}</SidebarBlock>}
      {resume.skills.soft.length > 0 && <SidebarBlock title="Strengths">{resume.skills.soft.map((s) => <div key={s}>• {s}</div>)}</SidebarBlock>}
      {resume.skills.languages.length > 0 && <SidebarBlock title="Languages">{resume.skills.languages.map((s) => <div key={s}>• {s}</div>)}</SidebarBlock>}
      {resume.certifications.length > 0 && <SidebarBlock title="Certifications">{resume.certifications.map((c) => <div key={c.id}>• {c.name}</div>)}</SidebarBlock>}
    </aside>
  );
  const Main = (
    <main className="p-6 text-[11pt]">
      {resume.summary && (
        <Section title="Profile" accent={template.theme.primary} style={template.sectionStyle} font={template.font}>
          <p className="leading-snug">{resume.summary}</p>
        </Section>
      )}
      <Section title="Work Experience" accent={template.theme.primary} style={template.sectionStyle} font={template.font}>
        <ExperienceList resume={resume} accent={template.theme.primary} />
      </Section>
      <Section title="Education" accent={template.theme.primary} style={template.sectionStyle} font={template.font}>
        <EducationList resume={resume} accent={template.theme.primary} />
      </Section>
      {resume.projects.length > 0 && (
        <Section title="Projects" accent={template.theme.primary} style={template.sectionStyle} font={template.font}>
          <ProjectsList resume={resume} />
        </Section>
      )}
    </main>
  );
  return (
    <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font) }}>
      <div className={`grid min-h-full ${side === 'left' ? 'grid-cols-[35%_65%]' : 'grid-cols-[65%_35%]'}`}>
        {side === 'left' ? Sidebar : Main}
        {side === 'left' ? Main : Sidebar}
      </div>
    </div>
  );
});
SidebarLayout.displayName = 'SidebarLayout';

function SidebarBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 text-[10pt]">
      <h3 className="font-bold uppercase tracking-widest text-[9pt] pb-1 mb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}>{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* ================================================================
   6. HEADER CARD
================================================================ */

const HeaderCardLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font) }}>
    <div className="text-white" style={{ background: gradient(template), padding: '0.5in 0.6in 0.4in 0.6in' }}>
      <h1 className="text-[28pt] font-extrabold leading-none tracking-tight">{resume.contact.fullName || 'Your Name'}</h1>
      {resume.targetJobTitle && <p className="mt-1 text-[12pt] font-medium" style={{ color: template.theme.secondary || '#fff' }}>{resume.targetJobTitle}</p>}
      <div className="mt-3 h-px w-full opacity-30 bg-white" />
      <ContactLine resume={resume} className="text-white/95 mt-2" />
    </div>
    <div style={{ padding: '0.4in 0.6in' }}>
      <Body template={template} resume={resume} />
    </div>
  </div>
));
HeaderCardLayout.displayName = 'HeaderCardLayout';

/* ================================================================
   7. SPLIT HEADER
================================================================ */

const SplitHeaderLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => {
  const second = template.theme.secondary || '#f8fafc';
  return (
    <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font) }}>
      <div className="grid grid-cols-[55%_45%]" style={{ minHeight: '1.4in' }}>
        <div className="text-white flex items-center px-7" style={{ background: template.theme.primary }}>
          <div>
            <h1 className="text-[26pt] font-extrabold leading-none tracking-tight">{resume.contact.fullName || 'Your Name'}</h1>
            {resume.targetJobTitle && <p className="mt-1 text-[12pt] opacity-90">{resume.targetJobTitle}</p>}
          </div>
        </div>
        <div className="px-6 py-5 text-[10pt] text-slate-800" style={{ background: second }}>
          <div className="font-bold uppercase tracking-widest text-[9pt] mb-2" style={{ color: template.theme.primary }}>Contact</div>
          {resume.contact.email && <div className="break-words">✉ {resume.contact.email}</div>}
          {resume.contact.phone && <div>☎ {resume.contact.phone}</div>}
          {resume.contact.location && <div>📍 {resume.contact.location}</div>}
          {resume.contact.linkedin && <div className="break-words">in {resume.contact.linkedin}</div>}
          {resume.contact.github && <div className="break-words">⌘ {resume.contact.github}</div>}
          {resume.contact.portfolio && <div className="break-words">🌐 {resume.contact.portfolio}</div>}
        </div>
      </div>
      <div style={{ padding: '0.4in 0.6in' }}>
        <Body template={template} resume={resume} />
      </div>
    </div>
  );
});
SplitHeaderLayout.displayName = 'SplitHeaderLayout';

/* ================================================================
   8. MONOGRAM
================================================================ */

const MonogramLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), padding: '0.55in 0.6in' }}>
    <header className="mb-5 flex items-center gap-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[22pt] font-extrabold shrink-0 shadow-md" style={{ background: gradient(template) }}>
        {initialsOf(resume.contact.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-[24pt] font-bold leading-tight" style={{ color: template.theme.primary }}>{resume.contact.fullName || 'Your Name'}</h1>
        {resume.targetJobTitle && <p className="text-[12pt] text-slate-600">{resume.targetJobTitle}</p>}
        <ContactLine resume={resume} className="text-slate-700 mt-1" />
      </div>
    </header>
    <Body template={template} resume={resume} />
  </div>
));
MonogramLayout.displayName = 'MonogramLayout';

/* ================================================================
   9. TIMELINE
================================================================ */

const TimelineLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => {
  const a = template.theme.primary;
  return (
    <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), padding: '0.6in', fontSize: '11pt', lineHeight: 1.45 }}>
      <Header template={template} resume={resume} />
      {resume.summary && <Section title="Profile" accent={a} style={template.sectionStyle} font={template.font}><p className="leading-snug">{resume.summary}</p></Section>}
      <section className="mb-3">
        <SectionTitle title="Work Experience" accent={a} style={template.sectionStyle} font={template.font} />
        <div className="relative pl-5 ml-1 border-l-2" style={{ borderColor: template.theme.secondary || a }}>
          <ExperienceList resume={resume} accent={a} dotted />
        </div>
      </section>
      <section className="mb-3">
        <SectionTitle title="Education" accent={a} style={template.sectionStyle} font={template.font} />
        <div className="relative pl-5 ml-1 border-l-2" style={{ borderColor: template.theme.secondary || a }}>
          {resume.education.map((e) => (
            <div key={e.id} className="mb-2 relative">
              <span className="absolute -left-[14px] top-[6px] w-2 h-2 rounded-full" style={{ background: a }} />
              <div className="flex justify-between gap-2">
                <div className="font-semibold">{e.degree}</div>
                <div className="text-[10pt] text-slate-600">{formatRange(e.startDate, e.endDate, resume.country)}</div>
              </div>
              <div className="text-[10.5pt]" style={{ color: a }}>{e.school}{e.location ? `, ${e.location}` : ''}{e.gpa ? ` — GPA: ${e.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      </section>
      <Section title="Skills" accent={a} style={template.sectionStyle} font={template.font}><SkillsList resume={resume} /></Section>
      {resume.projects.length > 0 && <Section title="Projects" accent={a} style={template.sectionStyle} font={template.font}><ProjectsList resume={resume} /></Section>}
      {resume.certifications.length > 0 && <Section title="Certifications" accent={a} style={template.sectionStyle} font={template.font}><CertList resume={resume} /></Section>}
    </div>
  );
});
TimelineLayout.displayName = 'TimelineLayout';

/* ================================================================
   10. ACCENT STRIP LEFT
================================================================ */

const AccentStripLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => {
  const isMono = template.font === 'mono-accent';
  return (
    <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), fontSize: '11pt', lineHeight: 1.4 }}>
      <div className="flex min-h-full">
        <div className="w-2 shrink-0" style={{ background: gradient(template) }} />
        <div className="flex-1" style={{ padding: '0.55in 0.6in 0.55in 0.5in' }}>
          <header className="mb-4">
            <h1 className="text-[24pt] font-bold leading-tight" style={{ color: template.theme.primary }}>
              {isMono && <span className="opacity-50">{'> '}</span>}{resume.contact.fullName || 'Your Name'}
            </h1>
            {resume.targetJobTitle && <p className="text-[12pt] text-slate-600">{resume.targetJobTitle}</p>}
            <ContactLine resume={resume} className="text-slate-700 mt-1" />
          </header>
          <Body template={template} resume={resume} />
        </div>
      </div>
    </div>
  );
});
AccentStripLayout.displayName = 'AccentStripLayout';

/* ================================================================
   11. TOP BAR
================================================================ */

const TopBarLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), fontSize: '11pt', lineHeight: 1.4 }}>
    <div className="h-3" style={{ background: gradient(template) }} />
    <div style={{ padding: '0.5in 0.6in' }}>
      <Header template={template} resume={resume} />
      <Body template={template} resume={resume} />
    </div>
  </div>
));
TopBarLayout.displayName = 'TopBarLayout';

/* ================================================================
   12. MAGAZINE
================================================================ */

const MagazineLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => {
  const a = template.theme.primary;
  return (
    <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), padding: '0.55in 0.6in', fontSize: '11pt', lineHeight: 1.45 }}>
      <header className="mb-5">
        <div className="text-[8pt] uppercase tracking-[0.4em] text-slate-500">— Curriculum Vitæ —</div>
        <h1 className="text-[40pt] font-extrabold leading-none mt-1 tracking-tight" style={{ color: a }}>{resume.contact.fullName || 'Your Name'}</h1>
        <div className="flex items-end justify-between mt-2 border-t-4 pt-2" style={{ borderColor: a }}>
          {resume.targetJobTitle && <p className="text-[12pt] text-slate-700 font-semibold italic">{resume.targetJobTitle}</p>}
          <ContactLine resume={resume} className="text-slate-700" />
        </div>
      </header>
      <div className="grid grid-cols-[65%_35%] gap-6">
        <main>
          {resume.summary && <Section title="Profile" accent={a} style="plain" font={template.font}><p className="leading-snug">{resume.summary}</p></Section>}
          <Section title="Work Experience" accent={a} style="plain" font={template.font}><ExperienceList resume={resume} accent={a} /></Section>
          <Section title="Education" accent={a} style="plain" font={template.font}><EducationList resume={resume} accent={a} /></Section>
          {resume.projects.length > 0 && <Section title="Projects" accent={a} style="plain" font={template.font}><ProjectsList resume={resume} /></Section>}
        </main>
        <aside className="border-l-2 pl-4" style={{ borderColor: a }}>
          {resume.skills.technical.length > 0 && (
            <div className="mb-4">
              <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: a }}>Skills</div>
              <div className="text-[10.5pt]">{resume.skills.technical.join(' · ')}</div>
            </div>
          )}
          {resume.skills.tools.length > 0 && (
            <div className="mb-4">
              <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: a }}>Tools</div>
              <div className="text-[10.5pt]">{resume.skills.tools.join(' · ')}</div>
            </div>
          )}
          {resume.skills.soft.length > 0 && (
            <div className="mb-4">
              <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: a }}>Strengths</div>
              <div className="text-[10.5pt]">{resume.skills.soft.join(' · ')}</div>
            </div>
          )}
          {resume.skills.languages.length > 0 && (
            <div className="mb-4">
              <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: a }}>Languages</div>
              <div className="text-[10.5pt]">{resume.skills.languages.join(' · ')}</div>
            </div>
          )}
          {resume.certifications.length > 0 && (
            <div className="mb-4">
              <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: a }}>Certifications</div>
              {resume.certifications.map((c) => <div key={c.id} className="text-[10.5pt] mb-0.5">{c.name}{c.issuer ? `, ${c.issuer}` : ''}</div>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
});
MagazineLayout.displayName = 'MagazineLayout';

/* ================================================================
   13. CARD STACK — every section a soft card
================================================================ */

const CardStackLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => {
  const a = template.theme.primary;
  const bg = '#f8fafc';
  return (
    <div ref={ref} className="resume-paper text-slate-900" style={{ fontFamily: fontFamilyFor(template.font), background: bg, padding: '0.5in 0.55in', fontSize: '11pt', lineHeight: 1.4 }}>
      <div className="bg-white rounded-xl p-5 mb-3 shadow-sm border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <Header template={template} resume={resume} sectionAccent={a} />
      </div>
      {resume.summary && (
        <Card>
          <Section title="Profile" accent={a} style={template.sectionStyle} font={template.font}><p className="leading-snug">{resume.summary}</p></Section>
        </Card>
      )}
      <Card>
        <Section title="Work Experience" accent={a} style={template.sectionStyle} font={template.font}><ExperienceList resume={resume} accent={a} /></Section>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Section title="Education" accent={a} style={template.sectionStyle} font={template.font}><EducationList resume={resume} accent={a} /></Section>
        </Card>
        <Card>
          <Section title="Skills" accent={a} style={template.sectionStyle} font={template.font}><SkillsList resume={resume} /></Section>
        </Card>
      </div>
      {(resume.projects.length > 0 || resume.certifications.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {resume.projects.length > 0 && <Card><Section title="Projects" accent={a} style={template.sectionStyle} font={template.font}><ProjectsList resume={resume} /></Section></Card>}
          {resume.certifications.length > 0 && <Card><Section title="Certifications" accent={a} style={template.sectionStyle} font={template.font}><CertList resume={resume} /></Section></Card>}
        </div>
      )}
    </div>
  );
});
CardStackLayout.displayName = 'CardStackLayout';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl p-5 mb-3 shadow-sm border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>{children}</div>;
}

/* ================================================================
   14. HYBRID HEADER + SIDE
================================================================ */

const HybridLayout = forwardRef<HTMLDivElement, { resume: ResumeData; template: Template }>(({ resume, template }, ref) => (
  <div ref={ref} className="resume-paper bg-white text-slate-900" style={{ fontFamily: fontFamilyFor(template.font) }}>
    <div className="text-white" style={{ background: gradient(template), padding: '0.45in 0.6in 0.4in 0.6in' }}>
      <h1 className="text-[26pt] font-extrabold leading-none">{resume.contact.fullName || 'Your Name'}</h1>
      {resume.targetJobTitle && <p className="text-[12pt] mt-1 opacity-90">{resume.targetJobTitle}</p>}
      <ContactLine resume={resume} className="text-white/95 mt-2" />
    </div>
    <div className="grid grid-cols-[68%_32%]">
      <main className="p-6 text-[11pt]">
        {resume.summary && <Section title="Professional Summary" accent={template.theme.primary} style={template.sectionStyle} font={template.font}><p className="leading-snug">{resume.summary}</p></Section>}
        <Section title="Work Experience" accent={template.theme.primary} style={template.sectionStyle} font={template.font}><ExperienceList resume={resume} accent={template.theme.primary} /></Section>
        <Section title="Education" accent={template.theme.primary} style={template.sectionStyle} font={template.font}><EducationList resume={resume} accent={template.theme.primary} /></Section>
        {resume.projects.length > 0 && <Section title="Projects" accent={template.theme.primary} style={template.sectionStyle} font={template.font}><ProjectsList resume={resume} /></Section>}
      </main>
      <aside className="p-6 text-[10.5pt] border-l" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#f8fafc' }}>
        {resume.skills.technical.length > 0 && <SideMini title="Skills" accent={template.theme.primary} items={resume.skills.technical} />}
        {resume.skills.tools.length > 0 && <SideMini title="Tools" accent={template.theme.primary} items={resume.skills.tools} />}
        {resume.skills.soft.length > 0 && <SideMini title="Strengths" accent={template.theme.primary} items={resume.skills.soft} />}
        {resume.skills.languages.length > 0 && <SideMini title="Languages" accent={template.theme.primary} items={resume.skills.languages} />}
        {resume.certifications.length > 0 && <SideMini title="Certifications" accent={template.theme.primary} items={resume.certifications.map((c) => c.name)} />}
      </aside>
    </div>
  </div>
));
HybridLayout.displayName = 'HybridLayout';

function SideMini({ title, accent, items }: { title: string; accent: string; items: string[] }) {
  return (
    <div className="mb-4">
      <div className="text-[10pt] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>{title}</div>
      <div className="space-y-0.5">{items.map((s) => <div key={s}>• {s}</div>)}</div>
    </div>
  );
}
