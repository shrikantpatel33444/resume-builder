import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, FileText, Eye, Bot, Wand2, FileDown, Share2, Layers, Palette, Check, CloudCheck, MoreVertical, Undo2, Redo2, Sparkles, Settings, LayoutDashboard } from 'lucide-react';
import type { ResumeData } from '../types';
import { extractKeywords } from '../lib/keywords';
import { scoreResume } from '../lib/atsEngine';
import {
  autoFixResumeLocally,
  generateCoverLetterLocally,
} from '../lib/aiGenerator';
import {
  autoFixResumeWithAI,
  generateCoverLetterWithAI,
} from '../lib/groq';
import ATSScoreDashboard from './ATSScoreDashboard';
import ResumePreview from './ResumePreview';
import ResumeCanvas from './ResumeCanvas';
import TemplatePicker from './TemplatePicker';
import TemplateThumbnail from './TemplateThumbnail';
import CustomizeSidebar from './customize/CustomizeSidebar';
import AIToolsPanel from './customize/AIToolsPanel';
import ContentEditor from './customize/ContentEditor';
import Overview from './customize/Overview';
import { saveResume, recordScore } from '../lib/storage';
import { TEMPLATES } from '../lib/sampleData';
import { customizationFromTemplate } from '../lib/customization';
import { ATS_DOWNLOAD_THRESHOLD, MAX_HISTORY_ENTRIES } from '../lib/constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface Props {
  initial: ResumeData;
  onBack: () => void;
}

type Tab = 'overview' | 'edit' | 'visual' | 'ats' | 'cover' | 'customize' | 'ai';

export default function Editor({ initial, onBack }: Props) {
  const [resume, setResume] = useState<ResumeData>(initial);
  const [tab, setTab] = useState<Tab>('overview');
  const [fixing, setFixing] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [history, setHistory] = useState<ResumeData[]>([initial]);
  const [hIdx, setHIdx] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const downloadRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [printVariant, setPrintVariant] = useState<'ats' | 'visual' | null>(null);

  // Sync incoming initial resume change (e.g., user opens another resume).
  // Also seed customization from the template if missing so the sidebar starts in a sane state.
  useEffect(() => {
    const seeded = initial.customization
      ? initial
      : { ...initial, customization: customizationFromTemplate(initial.templateId) };
    setResume(seeded);
    setHistory([seeded]);
    setHIdx(0);
  }, [initial.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const keywords = useMemo(() => extractKeywords(resume.jobDescription), [resume.jobDescription]);
  const report = useMemo(() => scoreResume(resume, keywords), [resume, keywords]);


  const updateResume = useCallback((next: ResumeData, pushHistory = true) => {
    setResume(next);
    setSaveStatus('saving');
    if (pushHistory) {
      setHistory((prev) => {
        const trimmed = prev.slice(0, hIdx + 1);
        trimmed.push(next);
        return trimmed.slice(-MAX_HISTORY_ENTRIES);
      });
      setHIdx((idx) => Math.min(MAX_HISTORY_ENTRIES - 1, idx + 1));
    }
  }, [hIdx]);

  useEffect(() => {
    const t = setTimeout(() => {
      saveResume({ ...resume, updatedAt: Date.now() });
      recordScore(resume.id, report.percent);
      setSaveStatus('saved');
    }, 600);
    return () => clearTimeout(t);
  }, [resume, report.percent]);

  // (Download no longer gated by ATS score)

  const undo = useCallback(() => {
    if (hIdx > 0) {
      const newIdx = hIdx - 1;
      setHIdx(newIdx);
      setResume(history[newIdx]);
    }
  }, [hIdx, history]);

  const redo = useCallback(() => {
    if (hIdx < history.length - 1) {
      const newIdx = hIdx + 1;
      setHIdx(newIdx);
      setResume(history[newIdx]);
    }
  }, [hIdx, history]);

  // Close download dropdown & mobile menu on outside click / escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) setShowDownload(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMobileMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowDownload(false); setShowMobileMenu(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [undo, redo]); // undo/redo are stable useCallback refs


  const runAutoFix = async () => {
    setFixing(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      const allBullets = resume.experience.flatMap((e) => e.bullets).join('\n');
      const resumeText = `Job Title: ${resume.targetJobTitle || 'Professional'}\nSummary: ${resume.summary}\nExperience Bullets:\n${allBullets}\nSkills: ${[...resume.skills.technical, ...resume.skills.soft, ...resume.skills.tools].join(', ')}`;
      const allKw = [...keywords.critical, ...keywords.important];
      const result = await autoFixResumeWithAI(resumeText, allKw, report.percent);
      const fixed = { ...resume };
      if (result.summary) fixed.summary = result.summary;
      if (result.skills.length) {
        const tech = result.skills.filter((s) => !['leadership', 'communication', 'teamwork', 'problem-solving', 'adaptability', 'creativity'].includes(s.toLowerCase()));
        const soft = result.skills.filter((s) => ['leadership', 'communication', 'teamwork', 'problem-solving', 'adaptability', 'creativity'].includes(s.toLowerCase()));
        fixed.skills = { ...fixed.skills, technical: tech.slice(0, 15), soft: soft.slice(0, 8) };
      }
      if (Object.keys(result.experienceBullets).length) {
        fixed.experience = fixed.experience.map((exp, i) => {
          const newBullets = result.experienceBullets[i];
          return newBullets ? { ...exp, bullets: newBullets.slice(0, 6) } : exp;
        });
      }
      updateResume(fixed);
    } catch {
      const { resume: fixed } = autoFixResumeLocally(resume, keywords, 96);
      updateResume(fixed);
    }
    setFixing(false);
  };

  // Download is always available — no ATS score gate needed
  const safeFileName = (resume.contact.fullName || 'Resume').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'Resume';

  const handleDownloadPdf = (variant: 'ats' | 'visual') => {
    setPrintVariant(variant);
    // Wait for the off-screen print container to mount + paint
    setTimeout(() => {
      const prevTitle = document.title;
      document.title = `${safeFileName}_${variant === 'ats' ? 'ATS' : 'Visual'}`;
      window.print();
      // Restore after print dialog closes
      setTimeout(() => {
        document.title = prevTitle;
        setPrintVariant(null);
      }, 500);
    }, 120);
  };

  const handleDownloadTxt = () => {
    const txt = resumeToPlainText(resume);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName}_ATS.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async () => {
    try {
      // Encode full resume data — don't truncate
      const data = btoa(unescape(encodeURIComponent(JSON.stringify(resume))));
      const link = `${location.origin}${location.pathname}#share=${data}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        alert('Shareable link copied to clipboard.');
      } else {
        prompt('Copy your shareable link:', link);
      }
    } catch {
      alert('Could not copy link. Please try again.');
    }
  };

  const handleDownloadPdfDirect = async () => {
    setPrintVariant('visual');
    await new Promise((r) => setTimeout(r, 300));
    try {
      const el = printContainerRef.current;
      if (!el) { setPrintVariant(null); return; }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let pos = 0;
      pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
      const pageH = pdf.internal.pageSize.getHeight();
      if (pdfH > pageH) {
        const totalPages = Math.ceil(pdfH / pageH);
        for (let i = 1; i < totalPages; i++) {
          pos = -pageH * i;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
        }
      }
      pdf.save(`${safeFileName}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      handleDownloadPdf('visual');
    } finally {
      setPrintVariant(null);
    }
  };

  const handleDownloadDocx = async () => {
    const r = resume;
    const children: any[] = [];
    children.push(
      new Paragraph({ text: r.contact.fullName || 'Resume', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({
        children: [new TextRun({ text: [r.contact.email, r.contact.phone, r.contact.location, r.contact.linkedin].filter(Boolean).join(' | '), size: 20 })],
        alignment: AlignmentType.CENTER, spacing: { after: 300 },
      }),
    );
    if (r.summary) {
      children.push(new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: r.summary, spacing: { after: 200 } }));
    }
    if (r.experience.length > 0) {
      children.push(new Paragraph({ text: 'WORK EXPERIENCE', heading: HeadingLevel.HEADING_1 }));
      for (const e of r.experience) {
        children.push(new Paragraph({ text: `${e.title} — ${e.company} (${e.startDate} to ${e.endDate})`, heading: HeadingLevel.HEADING_2 }));
        for (const b of e.bullets) {
          children.push(new Paragraph({ text: b, bullet: { level: 0 }, spacing: { after: 40 } }));
        }
      }
    }
    if (r.education.length > 0) {
      children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_1 }));
      for (const e of r.education) {
        children.push(new Paragraph({ text: `${e.degree} — ${e.school}${e.location ? `, ${e.location}` : ''} (${e.startDate} to ${e.endDate})`, spacing: { after: 80 } }));
      }
    }
    const skillLines: string[] = [];
    if (r.skills.technical.length) skillLines.push(`Technical: ${r.skills.technical.join(', ')}`);
    if (r.skills.tools.length) skillLines.push(`Tools: ${r.skills.tools.join(', ')}`);
    if (r.skills.soft.length) skillLines.push(`Soft Skills: ${r.skills.soft.join(', ')}`);
    if (r.skills.languages.length) skillLines.push(`Languages: ${r.skills.languages.join(', ')}`);
    if (skillLines.length > 0) {
      children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_1 }));
      for (const s of skillLines) children.push(new Paragraph({ text: s, spacing: { after: 60 } }));
    }
    if (r.projects.length > 0) {
      children.push(new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_1 }));
      for (const p of r.projects) {
        children.push(new Paragraph({ text: `${p.name}${p.tech ? ` (${p.tech})` : ''}${p.description ? ` — ${p.description}` : ''}`, spacing: { after: 60 } }));
      }
    }
    if (r.certifications.length > 0) {
      children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_1 }));
      for (const c of r.certifications) {
        children.push(new Paragraph({ text: `${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`, spacing: { after: 60 } }));
      }
    }
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${safeFileName}.docx`);
  };

  const TABS: { k: Tab; label: string; icon: React.ReactNode }[] = [
    { k: 'overview',  label: 'Overview',  icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { k: 'edit',      label: 'Content',   icon: <FileText className="w-3.5 h-3.5" /> },
    { k: 'customize', label: 'Customize', icon: <Settings className="w-3.5 h-3.5" /> },
    { k: 'ai',        label: 'AI Tools',  icon: <Sparkles className="w-3.5 h-3.5" /> },
    { k: 'visual',    label: 'Preview',   icon: <Eye className="w-3.5 h-3.5" /> },
    { k: 'ats',       label: 'ATS View',  icon: <Bot className="w-3.5 h-3.5" /> },
    { k: 'cover',     label: 'Cover',     icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============ TOP BAR (responsive) ============ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 shrink-0" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            value={resume.title}
            onChange={(e) => updateResume({ ...resume, title: e.target.value }, false)}
            className="font-bold text-slate-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded px-2 py-1 text-sm flex-1 min-w-0"
          />

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={undo} disabled={hIdx === 0} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40" title="Undo (Ctrl+Z)" aria-label="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={hIdx === history.length - 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40" title="Redo (Ctrl+Y)" aria-label="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowTemplatePicker(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-100 to-indigo-100 text-indigo-700 hover:from-fuchsia-200 hover:to-indigo-200 flex items-center gap-1 font-semibold">
              <Palette className="w-3.5 h-3.5" /> Template
            </button>
            <SaveStatusBadge status={saveStatus} />
          </div>

          {/* Mobile "more" menu */}
          <div className="md:hidden relative" ref={moreRef}>
            <button onClick={() => setShowMobileMenu((s) => !s)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="More actions">
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-40">
                  <MenuRow icon={<Undo2 className="w-4 h-4" />} label="Undo" disabled={hIdx === 0} onClick={() => { undo(); setShowMobileMenu(false); }} />
                  <MenuRow icon={<Redo2 className="w-4 h-4" />} label="Redo" disabled={hIdx === history.length - 1} onClick={() => { redo(); setShowMobileMenu(false); }} />
                  <MenuRow icon={<Palette className="w-4 h-4 text-indigo-600" />} label="Change Template" onClick={() => { setShowTemplatePicker(true); setShowMobileMenu(false); }} />
                  <div className="px-3 py-2 border-t border-slate-100 mt-1"><SaveStatusBadge status={saveStatus} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Download — always available */}
          <div className="relative shrink-0" ref={downloadRef}>
            <button
              onClick={() => setShowDownload((s) => !s)}
              className="px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow hover:shadow-lg"
              title="Download resume"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <AnimatePresence>
              {showDownload && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40"
                >
                  {report.percent < ATS_DOWNLOAD_THRESHOLD && (
                    <div className="px-3 py-2 mb-1 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs text-amber-700 font-medium">⚠️ ATS score {report.percent}% — fix issues to improve chances</p>
                    </div>
                  )}
                  <DownloadItem icon={<FileDown className="text-emerald-600" />} title="ATS PDF" desc="For online job portals" onClick={() => { setShowDownload(false); handleDownloadPdf('ats'); }} />
                  <DownloadItem icon={<FileDown className="text-indigo-600" />} title="Visual PDF" desc="For email / in-person" onClick={() => { setShowDownload(false); handleDownloadPdf('visual'); }} />
                  <DownloadItem icon={<FileText className="text-slate-600" />} title="Plain Text (.txt)" desc="Most ATS-friendly" onClick={() => { setShowDownload(false); handleDownloadTxt(); }} />
                  <DownloadItem icon={<Share2 className="text-violet-600" />} title="Share Link" desc="Send to recruiters" onClick={() => { setShowDownload(false); handleShare(); }} />
                  <div className="border-t border-slate-100 my-1" />
                  <DownloadItem icon={<FileDown className="text-rose-600" />} title="Download PDF" desc="Proper PDF (html2canvas + jsPDF)" onClick={() => { setShowDownload(false); handleDownloadPdfDirect(); }} />
                  <DownloadItem icon={<FileText className="text-blue-600" />} title="Download DOCX" desc="Word document (docx)" onClick={() => { setShowDownload(false); handleDownloadDocx(); }} />
                  <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100 mt-1">
                    Scored <b className="text-emerald-600">{report.percent}%</b> on ATS · Optimized for <b>{resume.country}</b> · Compatible with <b>{report.compatibility.filter((c) => c.ok).length}/10</b> systems
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs — always visible (mobile + desktop) */}
        <div className="border-t border-slate-100 px-3 sm:px-4 max-w-[1600px] mx-auto">
          <div className="flex bg-slate-50 rounded-lg p-1 my-2 text-xs font-medium overflow-x-auto tab-scroll gap-1">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`max-lg:flex-none lg:flex-1 px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
                  tab === t.k ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ MAIN ============ */}
      {tab === 'overview' ? (
        /* OVERVIEW — centered dashboard */
        <div className="max-w-[1600px] mx-auto p-3 sm:p-6">
          <Overview
            resume={resume}
            report={report}
            onAutoFix={runAutoFix}
            onGoTab={(t) => setTab(t as Tab)}
          />
        </div>
      ) : tab === 'edit' ? (
        /* CONTENT — 3-column workspace: Customize sidebar | ContentEditor | Live Preview */
        <div className="max-w-[1700px] mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_minmax(0,1fr)] gap-4">
          {/* LEFT: Customize sidebar */}
          <aside
            className="hidden lg:block lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1 print:hidden rounded-2xl"
            style={{ background: '#f5f5f0', padding: 12 }}
          >
            <CustomizeSidebar resume={resume} onChange={updateResume} onBrowseTemplates={() => setShowTemplatePicker(true)} />
          </aside>

          {/* CENTER: Card-based ContentEditor */}
          <div className="lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1 print:hidden">
            <ContentEditor resume={resume} onChange={updateResume} />
          </div>

          {/* RIGHT: Live preview */}
          <div className="hidden lg:block bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] p-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live preview
            </div>
            <ResumeCanvas>
              <ResumePreview resume={resume} variant="visual" />
            </ResumeCanvas>
          </div>

          {/* Mobile preview accordion: shown under content editor on small screens */}
          <details className="lg:hidden bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-1">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Eye className="w-4 h-4 text-indigo-500" /> Show live preview
            </summary>
            <div className="bg-slate-100 p-3">
              <ResumeCanvas><ResumePreview resume={resume} variant="visual" /></ResumeCanvas>
            </div>
          </details>
        </div>
      ) : tab === 'customize' || tab === 'ai' ? (
        /* CUSTOMIZE / AI — 2-column: sidebar + live preview */
        <div className="max-w-[1600px] mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-4">
          <aside
            className="lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1 print:hidden rounded-2xl"
            style={{ background: '#f5f5f0', padding: 12 }}
          >
            {tab === 'customize' ? (
              <CustomizeSidebar resume={resume} onChange={updateResume} onBrowseTemplates={() => setShowTemplatePicker(true)} />
            ) : (
              <AIToolsPanel resume={resume} onChange={updateResume} />
            )}
          </aside>
          <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] p-3 sm:p-4">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live preview · changes apply instantly
            </div>
            <ResumeCanvas>
              <ResumePreview resume={resume} variant="visual" />
            </ResumeCanvas>
          </div>
        </div>
      ) : (
        /* PREVIEW / ATS / COVER — single-panel with ATS dashboard sidebar */
        <div className="max-w-[1600px] mx-auto p-3 sm:p-4 grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="border-b border-slate-100 px-4 py-2 flex items-center gap-2 text-xs text-slate-500 print:hidden">
              <Layers className="w-3.5 h-3.5" />
              {tab === 'visual' ? 'Visual Preview' : tab === 'ats' ? 'ATS Bot View — exactly how an ATS reads your resume' : 'Cover Letter (ATS-optimized)'}
            </div>
            <div className={tab === 'cover' ? 'p-4' : 'p-3 sm:p-4 bg-slate-100'}>
              {tab === 'visual' && (
                <ResumeCanvas>
                  <ResumePreview resume={resume} variant="visual" />
                </ResumeCanvas>
              )}
              {tab === 'ats' && (
                <ResumeCanvas>
                  <ResumePreview resume={resume} variant="ats" />
                </ResumeCanvas>
              )}
              {tab === 'cover' && <CoverLetterPanel resume={resume} keywords={keywords} />}
            </div>
          </div>

          <div className="lg:sticky lg:top-32 self-start space-y-3 print:hidden order-first lg:order-none">
            <ATSScoreDashboard report={report} onAutoFix={runAutoFix} fixing={fixing} />
            <TemplateSwitcher resume={resume} onChange={(id) => updateResume({ ...resume, templateId: id })} onBrowseAll={() => setShowTemplatePicker(true)} />
          </div>
        </div>
      )}

      {/* ============ OFF-SCREEN PRINT CONTAINER ============ */}
      {/* This element is invisible on screen but visible to the print stylesheet.
          It guarantees the resume is mounted before window.print() runs. */}
      {printVariant && (
        <div ref={printContainerRef} className="resume-print" aria-hidden style={{ position: 'fixed', left: '-10000px', top: 0 }}>
          <ResumePreview resume={resume} variant={printVariant} />
        </div>
      )}

      {/* Auto-fix overlay */}
      <AnimatePresence>
        {fixing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <Wand2 className="w-10 h-10 mx-auto text-indigo-600 animate-pulse mb-3" />
              <div className="font-bold text-slate-900 mb-1">Auto-Fixing Your Resume…</div>
              <div className="text-sm text-slate-500">Re-scoring until ATS ≥ 95%</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplatePicker && (
          <TemplatePicker
            resume={resume}
            onSelect={(id) => updateResume({ ...resume, templateId: id })}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SaveStatusBadge({ status }: { status: 'saved' | 'saving' }) {
  return (
    <span className={`text-[11px] font-medium flex items-center gap-1 ${status === 'saved' ? 'text-emerald-600' : 'text-slate-500'}`}>
      <CloudCheck className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-pulse' : ''}`} />
      {status === 'saved' ? 'Saved' : 'Saving…'}
    </span>
  );
}

function MenuRow({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 text-left"
    >
      {icon}<span>{label}</span>
    </button>
  );
}

function DownloadItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-left">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
    </button>
  );
}

function TemplateSwitcher({ resume, onChange, onBrowseAll }: { resume: ResumeData; onChange: (id: string) => void; onBrowseAll: () => void }) {
  const current = TEMPLATES.find((t) => t.id === resume.templateId);
  // Show 9 mixed: current + 8 popular spread across categories
  const featured = TEMPLATES.filter((t) =>
    ['classic-pro','onyx','aurora','stockholm','silicon-valley','editor','marble','monogram-pro','vienna']
      .includes(t.id)
  );
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5"><Palette className="w-4 h-4 text-indigo-600" /> Template</div>
        <button onClick={onBrowseAll} className="text-[11px] font-semibold text-indigo-700 hover:underline">All {TEMPLATES.length} →</button>
      </div>
      {current && (
        <div className="mb-2 text-[11px] text-slate-500 truncate">
          <b className="text-slate-800">{current.name}</b> · {current.category} · ATS <b className="text-emerald-600">{current.scores.ats}</b>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {featured.map((t) => {
          const selected = resume.templateId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              title={t.name}
              className={`text-left rounded-lg border-2 overflow-hidden transition hover:shadow bg-slate-50 ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="relative" style={{ aspectRatio: '200/264' }}>
                <TemplateThumbnail template={t} />
                {selected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <div className="px-1.5 py-1 text-[9px] font-semibold text-slate-700 truncate">{t.name}</div>
            </button>
          );
        })}
      </div>
      <button onClick={onBrowseAll} className="mt-2 w-full text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2 rounded-lg hover:shadow flex items-center justify-center gap-1">
        <Palette className="w-3.5 h-3.5" /> Browse {TEMPLATES.length} templates
      </button>
    </div>
  );
}

/* EditPanel and its helper components were removed — replaced by the card-based
   ContentEditor mounted in the Content tab (see src/components/customize/ContentEditor.tsx). */

function CoverLetterPanel({ resume, keywords }: { resume: ResumeData; keywords: ReturnType<typeof extractKeywords> }) {
  const [text, setText] = useState(() => generateCoverLetterLocally(resume, keywords));
  const [edited, setEdited] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!edited && !generating) setText(generateCoverLetterLocally(resume, keywords));
  }, [resume, keywords, edited, generating]);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const allKw     = [...keywords.critical, ...keywords.important];
      const allBullets = resume.experience.flatMap((e) => e.bullets);
      const result = await generateCoverLetterWithAI(
        resume.contact.fullName,
        resume.targetJobTitle || 'Professional',
        allKw,
        resume.summary,
        allBullets,
      );
      setText(result);
    } catch {
      setText(generateCoverLetterLocally(resume, keywords));
    }
    setEdited(false);
    setGenerating(false);
  };

  const download = () => {
    const safe = (resume.contact.fullName || 'CoverLetter').replace(/[^\w]+/g, '_');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safe}_CoverLetter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
        <h3 className="font-bold text-slate-900">AI Cover Letter — ATS Optimized</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={regenerate} disabled={generating} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-1"><Wand2 className={`w-3 h-3 ${generating ? 'animate-pulse' : ''}`} /> {generating ? 'Generating…' : 'Regenerate'}</button>
          <button onClick={download} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"><Download className="w-3 h-3" /> Download .txt</button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setEdited(true); }}
        className="w-full h-[420px] sm:h-[480px] border border-slate-200 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {edited && <p className="mt-2 text-xs text-slate-500">✏️ You've edited this letter — auto-refresh is paused. Click <b>Regenerate</b> to reset.</p>}
    </div>
  );
}

function resumeToPlainText(r: ResumeData): string {
  const lines: string[] = [];
  lines.push(r.contact.fullName.toUpperCase());
  lines.push([r.contact.email, r.contact.phone, r.contact.location, r.contact.linkedin].filter(Boolean).join(' | '));
  lines.push('', 'PROFESSIONAL SUMMARY', r.summary, '', 'WORK EXPERIENCE');
  r.experience.forEach((e) => {
    lines.push(`${e.title} — ${e.company} (${e.startDate} to ${e.endDate})`);
    e.bullets.forEach((b) => lines.push(`- ${b}`));
    lines.push('');
  });
  lines.push('EDUCATION');
  r.education.forEach((e) => lines.push(`${e.degree} — ${e.school} (${e.startDate} to ${e.endDate})`));
  lines.push('', 'SKILLS');
  if (r.skills.technical.length) lines.push('Technical: ' + r.skills.technical.join(', '));
  if (r.skills.tools.length) lines.push('Tools: ' + r.skills.tools.join(', '));
  if (r.skills.soft.length) lines.push('Soft Skills: ' + r.skills.soft.join(', '));
  if (r.skills.languages.length) lines.push('Languages: ' + r.skills.languages.join(', '));
  if (r.certifications.length) {
    lines.push('', 'CERTIFICATIONS');
    r.certifications.forEach((c) => lines.push(`${c.name} — ${c.issuer} (${c.date})`));
  }
  return lines.join('\n');
}


