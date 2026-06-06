import { useMemo } from 'react';
import { ShieldCheck, FileText, Briefcase, GraduationCap, Wrench, Award, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Palette, Globe2, Zap } from 'lucide-react';
import type { ResumeData, ATSReport } from '../../types';
import { scoreLevel } from '../../lib/atsEngine';
import { getTemplate } from '../../lib/templateEngine';
import { Card } from './controls';

interface Props {
  resume: ResumeData;
  report: ATSReport;
  onAutoFix: () => void;
  onGoTab: (tab: 'edit' | 'customize' | 'ai' | 'visual' | 'ats' | 'cover') => void;
}

export default function Overview({ resume, report, onAutoFix, onGoTab }: Props) {
  const level = scoreLevel(report.percent);
  const template = getTemplate(resume.templateId);

  // Compute resume completeness
  const completeness = useMemo(() => {
    const checks = [
      { key: 'name',       label: 'Name',                 ok: resume.contact.fullName.trim().length > 2 },
      { key: 'email',      label: 'Email',                ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.contact.email) },
      { key: 'phone',      label: 'Phone',                ok: resume.contact.phone.trim().length > 6 },
      { key: 'location',   label: 'Location',             ok: resume.contact.location.trim().length > 2 },
      { key: 'summary',    label: 'Professional Summary', ok: resume.summary.trim().length > 80 },
      { key: 'experience', label: 'Work Experience',      ok: resume.experience.length > 0 && resume.experience.every((e) => e.title && e.company) },
      { key: 'education',  label: 'Education',            ok: resume.education.length > 0 },
      { key: 'skills',     label: 'Skills',               ok: resume.skills.technical.length + resume.skills.tools.length + resume.skills.soft.length > 4 },
      { key: 'jd',         label: 'Job Description',      ok: resume.jobDescription.trim().length > 80 },
    ];
    const done = checks.filter((c) => c.ok).length;
    return { checks, done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [resume]);

  const wordCount = useMemo(() => {
    const all = [
      resume.summary,
      ...resume.experience.flatMap((e) => e.bullets),
      ...resume.projects.map((p) => p.description),
    ].join(' ');
    return all.split(/\s+/).filter(Boolean).length;
  }, [resume]);

  const topIssue = useMemo(() => {
    const lowest = [...report.parameters].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
    return lowest && lowest.issues[0] ? { name: lowest.name, issue: lowest.issues[0] } : null;
  }, [report]);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* HERO BANNER */}
      <div className="rounded-2xl p-5 sm:p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${template.theme.primary} 0%, ${template.theme.secondary || template.theme.primary} 100%)` }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest opacity-80">Resume Health Overview</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 truncate">{resume.contact.fullName || 'Untitled Resume'}</h2>
            <p className="text-sm opacity-90 mt-0.5 truncate">{resume.targetJobTitle || 'No target role set'} · {resume.country}</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-5xl font-extrabold tabular-nums">{report.percent}%</div>
            <div className="text-xs uppercase tracking-widest opacity-80 mt-1">{level.emoji} {level.label}</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${report.percent}%` }} />
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<Briefcase className="w-4 h-4 text-indigo-500" />} label="Experiences"    value={resume.experience.length} />
        <Stat icon={<GraduationCap className="w-4 h-4 text-emerald-500" />} label="Education"  value={resume.education.length} />
        <Stat icon={<Wrench className="w-4 h-4 text-blue-500" />} label="Skills"               value={resume.skills.technical.length + resume.skills.tools.length + resume.skills.soft.length} />
        <Stat icon={<Award className="w-4 h-4 text-amber-500" />} label="Certifications"      value={resume.certifications.length} />
      </div>

      {/* COMPLETENESS + ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resume Completeness
            </h3>
            <span className="text-xs font-bold text-slate-700">{completeness.done}/{completeness.total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full" style={{ width: `${completeness.pct}%` }} />
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {completeness.checks.map((c) => (
              <div key={c.key} className="flex items-center gap-1.5">
                {c.ok
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  : <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                <span className={c.ok ? 'text-slate-600' : 'text-slate-800 font-medium'}>{c.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Quick Actions
          </h3>
          <div className="space-y-2">
            <QuickAction
              icon={<Zap className="w-4 h-4" />}
              label="Auto-fix ATS issues"
              desc={`Bring score to 95%+ instantly`}
              gradient="from-indigo-600 to-violet-600"
              onClick={onAutoFix}
              disabled={report.percent >= 96}
              disabledLabel="Score already 96%+"
            />
            <QuickAction
              icon={<FileText className="w-4 h-4" />}
              label="Edit content"
              desc="Add or update sections"
              gradient="from-slate-700 to-slate-900"
              onClick={() => onGoTab('edit')}
            />
            <QuickAction
              icon={<Palette className="w-4 h-4" />}
              label="Customize design"
              desc="Fonts, colors, layout"
              gradient="from-fuchsia-500 to-pink-600"
              onClick={() => onGoTab('customize')}
            />
            <QuickAction
              icon={<Sparkles className="w-4 h-4" />}
              label="AI tools"
              desc="Translate & spell-check"
              gradient="from-amber-500 to-orange-600"
              onClick={() => onGoTab('ai')}
            />
          </div>
        </Card>
      </div>

      {/* INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Globe2 className="w-3 h-3" /> Target Market</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{resume.country}</div>
          <div className="text-xs text-slate-500 mt-1">Date format & conventions adapted automatically.</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><Palette className="w-3 h-3" /> Active Template</div>
          <div className="text-xl font-bold text-slate-900 mt-1 truncate">{template.name}</div>
          <div className="text-xs text-slate-500 mt-1">{template.category} · ATS {template.scores.ats}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1"><FileText className="w-3 h-3" /> Word Count</div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{wordCount}</div>
          <div className="text-xs text-slate-500 mt-1">{wordCount < 250 ? 'A bit short — add detail' : wordCount > 800 ? 'Quite long — consider trimming' : 'Right in the sweet spot'}</div>
        </Card>
      </div>

      {/* TOP ISSUE CALLOUT */}
      {topIssue && report.percent < 95 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Top issue to fix</div>
              <div className="font-bold text-slate-900 mt-0.5">{topIssue.name}</div>
              <p className="text-sm text-slate-700">{topIssue.issue}</p>
            </div>
            <button
              onClick={onAutoFix}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-xs shadow hover:shadow-md whitespace-nowrap flex items-center gap-1"
            >
              Fix <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      )}

      {/* COMPATIBILITY */}
      <Card className="p-4">
        <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> ATS System Compatibility
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          {report.compatibility.map((c) => (
            <div key={c.system} className="flex items-center gap-1.5">
              {c.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
              <span className={c.ok ? 'text-slate-700' : 'text-slate-400'}>{c.system}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{icon}{label}</div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{value}</div>
    </Card>
  );
}

function QuickAction({ icon, label, desc, gradient, onClick, disabled, disabledLabel }: { icon: React.ReactNode; label: string; desc: string; gradient: string; onClick: () => void; disabled?: boolean; disabledLabel?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-[11px] text-slate-500 truncate">{disabled && disabledLabel ? disabledLabel : desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
  );
}
