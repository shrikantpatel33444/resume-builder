import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Wizard from './components/Wizard';
import Editor from './components/Editor';
import ATSGuide from './components/ATSGuide';
import Dashboard from './components/Dashboard';
import TemplatesGallery from './components/TemplatesGallery';
import type { ResumeData } from './types';
import { sampleResume } from './lib/sampleData';
import { Sparkles, LayoutDashboard, BookOpen, Layers, Menu, X } from 'lucide-react';

type View = 'landing' | 'editor' | 'guide' | 'dashboard' | 'templates';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [prevView, setPrevView] = useState<View>('landing'); // remembered when entering editor
  const [current, setCurrent] = useState<ResumeData | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const startNew = () => { setShowWizard(true); setMobileMenuOpen(false); };
  const goView = (v: View) => { setView(v); setMobileMenuOpen(false); };

  const enterEditor = (r: ResumeData) => {
    setCurrent(r);
    setPrevView(view);
    setView('editor');
  };

  const handleComplete = (r: ResumeData) => {
    setShowWizard(false);
    enterEditor(r);
  };

  /**
   * Pick a template from the gallery.
   * BUG FIX: previously always replaced the user's in-progress resume with the sample.
   * Now: if a resume is in-progress (loaded in editor), just change its templateId.
   * Otherwise create a fresh resume from the sample, with the chosen template.
   */
  const useTemplate = (templateId: string) => {
    if (current && view === 'editor') {
      // Just swap template — preserve all data
      const updated = { ...current, templateId };
      setCurrent(updated);
      return;
    }
    const r = sampleResume();
    r.templateId = templateId;
    enterEditor(r);
  };

  return (
    <div className="font-sans antialiased text-slate-900">
      {view !== 'editor' && (
        <nav className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-40 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
            <button onClick={() => goView('landing')} className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-tight truncate">SmartCV <span className="text-indigo-600">Pro</span></span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 text-sm">
              <NavBtn active={view === 'templates'} onClick={() => goView('templates')} icon={<Layers className="w-4 h-4" />} label="Templates" />
              <NavBtn active={view === 'guide'} onClick={() => goView('guide')} icon={<BookOpen className="w-4 h-4" />} label="ATS Guide" />
              <NavBtn active={view === 'dashboard'} onClick={() => goView('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
              <button onClick={startNew} className="ml-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow hover:shadow-lg transition">
                Build Resume
              </button>
            </div>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-2">
              <button onClick={startNew} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-2 rounded-lg font-semibold text-xs shadow">
                Build
              </button>
              <button
                onClick={() => setMobileMenuOpen((s) => !s)}
                className="p-2 rounded-lg hover:bg-slate-100"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-slate-100 bg-white"
              >
                <div className="px-4 py-2 flex flex-col text-sm">
                  <MobileNavRow active={view === 'templates'} onClick={() => goView('templates')} icon={<Layers className="w-4 h-4" />} label="Templates" />
                  <MobileNavRow active={view === 'guide'} onClick={() => goView('guide')} icon={<BookOpen className="w-4 h-4" />} label="ATS Guide" />
                  <MobileNavRow active={view === 'dashboard'} onClick={() => goView('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      )}

      {view === 'landing' && (
        <Landing
          onStart={startNew}
          onOpenGuide={() => setView('guide')}
          onOpenDashboard={() => setView('dashboard')}
          onOpenTemplates={() => setView('templates')}
        />
      )}
      {view === 'guide' && <ATSGuide onBack={() => setView('landing')} />}
      {view === 'dashboard' && <Dashboard onBack={() => setView('landing')} onOpen={enterEditor} onNew={startNew} />}
      {view === 'templates' && <TemplatesGallery onBack={() => setView('landing')} onUse={useTemplate} />}
      {view === 'editor' && current && (
        <Editor
          initial={current}
          onBack={() => setView(prevView === 'editor' ? 'dashboard' : prevView)}
        />
      )}

      {showWizard && <Wizard onComplete={handleComplete} onCancel={() => setShowWizard(false)} />}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
      {icon}{label}
    </button>
  );
}

function MobileNavRow({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2.5 rounded-lg flex items-center gap-2 ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
    >
      {icon}{label}
    </button>
  );
}
