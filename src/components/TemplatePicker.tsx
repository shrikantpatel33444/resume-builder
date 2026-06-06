import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Search, Lock, SlidersHorizontal, Eye, Sparkles } from 'lucide-react';
import type { ResumeData } from '../types';
import { TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_COUNTRIES, type Template } from '../lib/templateEngine';
import TemplateThumbnail from './TemplateThumbnail';
import ResumePreview from './ResumePreview';

interface Props {
  resume: ResumeData;
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

const LAYOUT_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Layouts' },
  { id: 'single', label: 'Single Column' },
  { id: 'compact-ats', label: 'Compact ATS' },
  { id: 'sidebar-left', label: 'Left Sidebar' },
  { id: 'sidebar-right', label: 'Right Sidebar' },
  { id: 'centered', label: 'Center Focus' },
  { id: 'header-card', label: 'Top Header' },
  { id: 'split-header', label: 'Split Header' },
  { id: 'monogram', label: 'Monogram' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'accent-strip-left', label: 'Accent Strip' },
  { id: 'accent-strip-top', label: 'Top Bar' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'card-stack', label: 'Card Layout' },
  { id: 'hybrid-header-side', label: 'Hybrid' },
  { id: 'executive-banner', label: 'Executive Banner' },
];

const COLOR_FILTERS = ['all', 'navy', 'royal', 'emerald', 'teal', 'purple', 'burgundy', 'charcoal', 'mono', 'gold-exec', 'orange', 'aurora', 'midnight'];

const PAGE_SIZE = 36;

export default function TemplatePicker({ resume, onSelect, onClose }: Props) {
  const [category, setCategory] = useState<string>('All');
  const [country, setCountry] = useState<string>('All');
  const [layout, setLayout] = useState<string>('all');
  const [color, setColor] = useState<string>('all');
  const [tier, setTier] = useState<'all' | 'free' | 'premium'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [previewing, setPreviewing] = useState<Template | null>(null);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (country !== 'All' && t.country !== country) return false;
      if (layout !== 'all' && t.layout !== layout) return false;
      if (color !== 'all' && !t.theme.id.startsWith(color)) return false;
      if (tier !== 'all' && t.tier !== tier) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [category, country, layout, color, tier, query]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-stretch justify-center p-2 sm:p-4 overflow-y-auto print:hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl my-4 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> Template Library
            </h2>
            <p className="text-xs text-slate-500">
              <b className="text-slate-800">{TEMPLATES.length}</b> designer templates · 20 categories · 12 countries · ATS-safe
            </p>
          </div>
          <div className="flex-1 sm:max-w-md relative sm:ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search templates…"
              className="w-full bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-semibold transition ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select label="Category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={['All', ...TEMPLATE_CATEGORIES]} />
            <Select label="Country" value={country} onChange={(v) => { setCountry(v); setPage(1); }} options={['All', ...TEMPLATE_COUNTRIES]} />
            <Select label="Layout" value={layout} onChange={(v) => { setLayout(v); setPage(1); }} options={LAYOUT_FILTERS.map((f) => f.id)} renderLabel={(v) => LAYOUT_FILTERS.find((f) => f.id === v)?.label || v} />
            <Select label="Color" value={color} onChange={(v) => { setColor(v); setPage(1); }} options={COLOR_FILTERS} renderLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
          </div>
        )}

        {/* Quick chips */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-xs">
          <Chip active={tier === 'all'} onClick={() => { setTier('all'); setPage(1); }}>All ({TEMPLATES.length})</Chip>
          <Chip active={tier === 'free'} onClick={() => { setTier('free'); setPage(1); }}>Free</Chip>
          <Chip active={tier === 'premium'} onClick={() => { setTier('premium'); setPage(1); }}>Pro</Chip>
          <div className="w-px bg-slate-200 mx-1" />
          {TEMPLATE_CATEGORIES.slice(0, 10).map((c) => (
            <Chip key={c} active={category === c} onClick={() => { setCategory(category === c ? 'All' : c); setPage(1); }}>{c}</Chip>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <div className="text-xs text-slate-500 mb-3">
            Showing <b className="text-slate-800">{visible.length}</b> of <b className="text-slate-800">{filtered.length}</b> templates
            {filtered.length === 0 && <span className="text-amber-600"> — try clearing filters</span>}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">No templates match your filters.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {visible.map((t) => {
                  const selected = t.id === resume.templateId;
                  return (
                    <div
                      key={t.id}
                      className={`group bg-white rounded-xl border-2 overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5 ${
                        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => setPreviewing(t)}
                        className="block w-full bg-slate-100 relative"
                        style={{ aspectRatio: '200/264' }}
                        title="Click to preview full size"
                      >
                        <TemplateThumbnail template={t} />
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          {t.tier === 'premium' ? (
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="w-2 h-2" />PRO</span>
                          ) : (
                            <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">FREE</span>
                          )}
                        </div>
                        {selected && (
                          <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-2 h-2" />CURRENT
                          </div>
                        )}
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-white shadow-lg rounded-full px-3 py-1.5 text-xs font-semibold text-indigo-700 flex items-center gap-1 transition">
                            <Eye className="w-3 h-3" />Preview
                          </span>
                        </div>
                      </button>
                      <div className="p-2.5">
                        <div className="font-semibold text-slate-900 text-[12px] truncate">{t.name}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] text-slate-500 truncate">{t.category}</span>
                          <span className="text-[9px] font-bold text-emerald-600">ATS {t.scores.ats}</span>
                        </div>
                        <button
                          onClick={() => { onSelect(t.id); onClose(); }}
                          className={`mt-2 w-full text-[11px] font-semibold py-1 rounded-md transition ${
                            selected
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-900 text-white hover:bg-indigo-600'
                          }`}
                        >
                          {selected ? 'Selected' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visible.length < filtered.length && (
                <div className="mt-5 flex justify-center">
                  <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700">
                    Load more ({filtered.length - visible.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>💡 Click any thumbnail to see the full preview with your data · ATS PDF always exports single-column plain text.</span>
          <button onClick={onClose} className="text-indigo-600 font-semibold hover:underline">Done</button>
        </div>
      </motion.div>

      {/* Full preview modal */}
      {previewing && (
        <FullPreviewModal
          template={previewing}
          resume={resume}
          onClose={() => setPreviewing(null)}
          onApply={(id) => { onSelect(id); setPreviewing(null); onClose(); }}
        />
      )}
    </motion.div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options, renderLabel }: { label: string; value: string; onChange: (v: string) => void; options: string[]; renderLabel?: (v: string) => string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map((o) => <option key={o} value={o}>{renderLabel ? renderLabel(o) : o}</option>)}
      </select>
    </label>
  );
}

function FullPreviewModal({ template, resume, onClose, onApply }: { template: Template; resume: ResumeData; onClose: () => void; onApply: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{template.name}</div>
            <div className="text-xs text-slate-500 truncate">{template.category} · {template.country} · {template.layout.replace(/-/g, ' ')}</div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge label="ATS" value={template.scores.ats} />
            <ScoreBadge label="Modern" value={template.scores.modern} />
            <ScoreBadge label="Exec" value={template.scores.executive} />
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex justify-center">
          <div style={{ transformOrigin: 'top center' }}>
            <ResumePreview resume={{ ...resume, templateId: template.id }} variant="visual" />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">{template.description}</p>
          <button
            onClick={() => onApply(template.id)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-2 rounded-xl shadow hover:shadow-lg flex items-center gap-1.5 text-sm"
          >
            <Check className="w-4 h-4" /> Apply this template
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color = value >= 95 ? 'bg-emerald-100 text-emerald-700' : value >= 85 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label} {value}</span>;
}
