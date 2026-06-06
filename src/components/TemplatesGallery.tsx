import { useMemo, useState } from 'react';
import { ArrowLeft, Lock, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_COUNTRIES } from '../lib/templateEngine';
import TemplateThumbnail from './TemplateThumbnail';

interface Props {
  onBack: () => void;
  onUse: (templateId: string) => void;
}

const PAGE_SIZE = 48;

export default function TemplatesGallery({ onBack, onUse }: Props) {
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('All');
  const [tier, setTier] = useState<'all' | 'free' | 'premium'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => TEMPLATES.filter((t) => {
    if (category !== 'All' && t.category !== category) return false;
    if (country !== 'All' && t.country !== country) return false;
    if (tier !== 'all' && t.tier !== tier) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [category, country, tier, query]);
  const visible = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> Template Library</h1>
            <p className="text-[11px] text-slate-500">{TEMPLATES.length} designer templates · ATS-safe twin for every design</p>
          </div>
          <div className="flex-1 max-w-md relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search 500+ templates…"
              className="w-full bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-semibold ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Category</span>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                <option>All</option>
                {TEMPLATE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Country</span>
              <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                <option>All</option>
                {TEMPLATE_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Tier</span>
              <select value={tier} onChange={(e) => { setTier(e.target.value as 'all' | 'free' | 'premium'); setPage(1); }} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                <option value="all">All</option>
                <option value="free">Free</option>
                <option value="premium">Pro</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-xs text-slate-500 mb-4">
          Showing <b className="text-slate-800">{visible.length}</b> of <b className="text-slate-800">{filtered.length}</b> templates
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {visible.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition group">
              <div className="relative bg-slate-100" style={{ aspectRatio: '200/264' }}>
                <TemplateThumbnail template={t} />
                <div className="absolute top-2 right-2">
                  {t.tier === 'premium' ? (
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> PRO</span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{t.name}</h3>
                  <span className="text-[10px] font-bold text-emerald-600">ATS {t.scores.ats}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mb-2">{t.category} · {t.country}</p>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <Score n={t.scores.readability} l="Read" />
                  <Score n={t.scores.recruiter} l="Recr" />
                  <Score n={t.scores.executive} l="Exec" />
                  <Score n={t.scores.modern} l="Mod" />
                </div>
                <button onClick={() => onUse(t.id)} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:shadow-md">Use template</button>
              </div>
            </div>
          ))}
        </div>
        {visible.length < filtered.length && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow">
              Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Score({ n, l }: { n: number; l: string }) {
  const color = n >= 95 ? 'text-emerald-600' : n >= 85 ? 'text-yellow-600' : 'text-orange-600';
  return (
    <div className="text-center">
      <div className={`text-[10px] font-bold ${color} tabular-nums`}>{n}</div>
      <div className="text-[8px] text-slate-400 uppercase">{l}</div>
    </div>
  );
}
