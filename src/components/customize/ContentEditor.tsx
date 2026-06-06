import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MapPin, User, Camera, Plus, X, Trash2, GripVertical,
  Briefcase, GraduationCap, Wrench, FolderGit2, Award, Globe2, Heart,
  Users, FileText, Sparkles, ChevronDown,
} from 'lucide-react';
import type { ResumeData, Experience, Education, Project, Certification } from '../../types';
import { cryptoRandomId } from '../../lib/aiGenerator';
import { getCustomization } from '../../lib/customization';
import { Card } from './controls';

interface Props {
  resume: ResumeData;
  onChange: (r: ResumeData) => void;
}

type AddType =
  | 'experience' | 'education' | 'skills' | 'projects'
  | 'certifications' | 'languages' | 'hobbies' | 'references' | 'custom';

const ADD_OPTIONS: { type: AddType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { type: 'experience',     label: 'Work Experience',  desc: 'Add a job, internship, or role',         icon: <Briefcase className="w-5 h-5" />,    color: 'from-indigo-500 to-violet-600' },
  { type: 'education',      label: 'Education',         desc: 'Degree, school, or course',              icon: <GraduationCap className="w-5 h-5" />, color: 'from-emerald-500 to-green-600' },
  { type: 'skills',         label: 'Skills',            desc: 'Technical, soft, or tools',              icon: <Wrench className="w-5 h-5" />,        color: 'from-blue-500 to-cyan-600' },
  { type: 'projects',       label: 'Projects',          desc: 'Portfolio work or side projects',        icon: <FolderGit2 className="w-5 h-5" />,    color: 'from-fuchsia-500 to-pink-600' },
  { type: 'certifications', label: 'Certifications',    desc: 'Licenses, badges, courses',              icon: <Award className="w-5 h-5" />,         color: 'from-amber-500 to-orange-600' },
  { type: 'languages',      label: 'Languages',         desc: 'Spoken & proficiency levels',            icon: <Globe2 className="w-5 h-5" />,        color: 'from-teal-500 to-emerald-600' },
  { type: 'hobbies',        label: 'Hobbies / Interests', desc: 'Show your personality',                icon: <Heart className="w-5 h-5" />,         color: 'from-rose-500 to-red-600' },
  { type: 'references',     label: 'References',        desc: 'Contacts who can vouch for you',         icon: <Users className="w-5 h-5" />,         color: 'from-slate-500 to-slate-700' },
  { type: 'custom',         label: 'Custom Section',    desc: 'Anything else — Awards, Publications…',  icon: <Sparkles className="w-5 h-5" />,      color: 'from-purple-500 to-indigo-600' },
];

export default function ContentEditor({ resume, onChange }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const c = getCustomization(resume);
  const photo = c.profilePhoto;

  const update = (patch: Partial<ResumeData>) => onChange({ ...resume, ...patch });
  const updateContact = (key: keyof ResumeData['contact'], v: string) =>
    update({ contact: { ...resume.contact, [key]: v } });

  const fileRef = useRef<HTMLInputElement>(null);
  const onPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2_500_000) { alert('Image too large (max 2.5 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => onChange({ ...resume, customization: { ...c, profilePhoto: reader.result as string } });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* NAME + PHOTO CARD */}
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Your name
            </label>
            <input
              value={resume.contact.fullName}
              onChange={(e) => updateContact('fullName', e.target.value)}
              placeholder="John Doe"
              className="mt-1 w-full bg-transparent text-2xl sm:text-3xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none border-b-2 border-transparent focus:border-indigo-400 transition pb-1"
            />
            <input
              value={resume.targetJobTitle}
              onChange={(e) => update({ targetJobTitle: e.target.value })}
              placeholder="Professional title (e.g. Senior Frontend Engineer)"
              className="mt-2 w-full bg-transparent text-sm text-slate-600 placeholder-slate-300 focus:outline-none"
            />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border-2 border-dashed transition overflow-hidden flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-400 ${c.profilePhotoShape === 'circle' ? 'rounded-full' : c.profilePhotoShape === 'rounded' ? 'rounded-2xl' : 'rounded-lg'} ${photo ? 'border-transparent' : 'border-slate-300'}`}
            title={photo ? 'Replace photo' : 'Upload photo'}
          >
            {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
          </button>
        </div>
      </Card>

      {/* CONTACT CARDS */}
      <ContactRow icon={<Mail className="w-4 h-4 text-indigo-500" />}  label="Email"     value={resume.contact.email}     placeholder="name@example.com"        onChange={(v) => updateContact('email', v)} />
      <ContactRow icon={<Phone className="w-4 h-4 text-emerald-500" />} label="Phone"     value={resume.contact.phone}     placeholder="+1 555 555 5555"          onChange={(v) => updateContact('phone', v)} />
      <ContactRow icon={<MapPin className="w-4 h-4 text-rose-500" />}   label="Address"   value={resume.contact.location}  placeholder="City, Country"            onChange={(v) => updateContact('location', v)} />
      <ContactRow icon={<Globe2 className="w-4 h-4 text-cyan-600" />}   label="LinkedIn"  value={resume.contact.linkedin}  placeholder="linkedin.com/in/handle"   onChange={(v) => updateContact('linkedin', v)} />

      {/* ADD CONTENT BUTTON */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
      >
        <Plus className="w-5 h-5" /> Add Content
      </button>

      {/* PROFESSIONAL SUMMARY (always visible — it's the most important field) */}
      <SummaryCard resume={resume} onChange={onChange} />

      {/* EXISTING SECTIONS rendered as collapsible cards */}
      {resume.experience.length > 0 && (
        <SectionList<Experience>
          title="Work Experience"
          icon={<Briefcase className="w-4 h-4" />}
          items={resume.experience}
          renderHeader={(e) => `${e.title || 'Untitled role'} — ${e.company || 'Company'}`}
          renderSub={(e) => [e.startDate, e.endDate].filter(Boolean).join(' → ')}
          onUpdate={(arr) => update({ experience: arr })}
          onAdd={() => update({ experience: [...resume.experience, { id: cryptoRandomId(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] })}
          renderEditor={(e, onItem) => <ExperienceEditor item={e} onChange={onItem} />}
        />
      )}

      {resume.education.length > 0 && (
        <SectionList<Education>
          title="Education"
          icon={<GraduationCap className="w-4 h-4" />}
          items={resume.education}
          renderHeader={(e) => `${e.degree || 'Degree'} — ${e.school || 'School'}`}
          renderSub={(e) => [e.startDate, e.endDate].filter(Boolean).join(' → ')}
          onUpdate={(arr) => update({ education: arr })}
          onAdd={() => update({ education: [...resume.education, { id: cryptoRandomId(), degree: '', school: '', location: '', startDate: '', endDate: '' }] })}
          renderEditor={(e, onItem) => <EducationEditor item={e} onChange={onItem} />}
        />
      )}

      {(resume.skills.technical.length + resume.skills.soft.length + resume.skills.tools.length + resume.skills.languages.length > 0) && (
        <SkillsCard resume={resume} onChange={onChange} />
      )}

      {resume.projects.length > 0 && (
        <SectionList<Project>
          title="Projects"
          icon={<FolderGit2 className="w-4 h-4" />}
          items={resume.projects}
          renderHeader={(p) => p.name || 'Untitled project'}
          renderSub={(p) => p.tech || ''}
          onUpdate={(arr) => update({ projects: arr })}
          onAdd={() => update({ projects: [...resume.projects, { id: cryptoRandomId(), name: '', description: '', tech: '', link: '' }] })}
          renderEditor={(p, onItem) => <ProjectEditor item={p} onChange={onItem} />}
        />
      )}

      {resume.certifications.length > 0 && (
        <SectionList<Certification>
          title="Certifications"
          icon={<Award className="w-4 h-4" />}
          items={resume.certifications}
          renderHeader={(c) => c.name || 'Untitled certification'}
          renderSub={(c) => `${c.issuer || ''}${c.date ? ` · ${c.date}` : ''}`}
          onUpdate={(arr) => update({ certifications: arr })}
          onAdd={() => update({ certifications: [...resume.certifications, { id: cryptoRandomId(), name: '', issuer: '', date: '' }] })}
          renderEditor={(c, onItem) => <CertEditor item={c} onChange={onItem} />}
        />
      )}

      {/* ADD CONTENT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <AddContentModal
            resume={resume}
            onChange={onChange}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   CONTACT ROW CARD
============================================================ */

function ContactRow({ icon, label, value, placeholder, onChange }: {
  icon: React.ReactNode; label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <Card className="px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none"
        />
      </div>
    </Card>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({ resume, onChange }: { resume: ResumeData; onChange: (r: ResumeData) => void }) {
  const [open, setOpen] = useState(!!resume.summary);
  return (
    <Card>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3">
        <FileText className="w-4 h-4 text-slate-500" />
        <span className="font-semibold text-slate-900 text-sm flex-1 text-left">Professional Summary</span>
        {!resume.summary && <span className="text-[10px] font-medium text-amber-600">Recommended</span>}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <textarea
            value={resume.summary}
            onChange={(e) => onChange({ ...resume, summary: e.target.value })}
            placeholder="A 3–4 sentence pitch highlighting your role, years of experience, top skills, and biggest wins…"
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="mt-1 text-[10px] text-slate-400">{resume.summary.length} chars · Aim for 250–500 chars with 4+ keywords from the job description.</p>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   GENERIC COLLAPSIBLE SECTION LIST (with drag-to-reorder)
============================================================ */

function SectionList<T extends { id: string }>({
  title, icon, items, onUpdate, onAdd, renderHeader, renderSub, renderEditor,
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  onUpdate: (next: T[]) => void;
  onAdd: () => void;
  renderHeader: (item: T) => string;
  renderSub: (item: T) => string;
  renderEditor: (item: T, onChange: (next: T) => void) => React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onUpdate(next);
  };

  return (
    <Card>
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        {icon}
        <h3 className="font-bold text-slate-900 text-sm flex-1">{title}</h3>
        <span className="text-[10px] text-slate-400 font-medium tabular-nums">{items.length}</span>
        <button onClick={onAdd} className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="p-2 space-y-1.5">
        {items.map((it, idx) => {
          const isOpen = openId === it.id;
          return (
            <div
              key={it.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx !== null) move(dragIdx, idx); setDragIdx(null); }}
              className={`border border-slate-200 rounded-lg bg-white transition ${dragIdx === idx ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-1.5 px-2 py-2">
                <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab shrink-0" />
                <button
                  onClick={() => setOpenId(isOpen ? null : it.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="text-sm font-medium text-slate-800 truncate">{renderHeader(it) || 'Untitled'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{renderSub(it)}</div>
                </button>
                <button
                  onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  aria-label="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown
                  onClick={() => setOpenId(isOpen ? null : it.id)}
                  className={`w-4 h-4 text-slate-400 cursor-pointer transition ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 p-3 bg-slate-50/60">
                  {renderEditor(it, (next) => {
                    const arr = [...items];
                    arr[idx] = next;
                    onUpdate(arr);
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================
   ITEM EDITORS
============================================================ */

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function ExperienceEditor({ item, onChange }: { item: Experience; onChange: (next: Experience) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <FieldRow label="Job Title"><TextInput value={item.title}    onChange={(v) => onChange({ ...item, title: v })}    placeholder="Senior Frontend Engineer" /></FieldRow>
      <FieldRow label="Company"  ><TextInput value={item.company}  onChange={(v) => onChange({ ...item, company: v })}  placeholder="Northwind Tech" /></FieldRow>
      <FieldRow label="Location" ><TextInput value={item.location} onChange={(v) => onChange({ ...item, location: v })} placeholder="San Francisco, CA" /></FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Start (YYYY-MM)"><TextInput value={item.startDate} onChange={(v) => onChange({ ...item, startDate: v })} placeholder="2022-03" /></FieldRow>
        <FieldRow label="End (or Present)"><TextInput value={item.endDate}   onChange={(v) => onChange({ ...item, endDate: v, current: v === 'Present' })} placeholder="Present" /></FieldRow>
      </div>
      <label className="col-span-1 sm:col-span-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={item.current} onChange={(e) => onChange({ ...item, current: e.target.checked, endDate: e.target.checked ? 'Present' : item.endDate })} className="accent-indigo-600" />
        Current role
      </label>
      <div className="col-span-1 sm:col-span-2">
        <FieldRow label="Bullets (one per line)">
          <textarea
            value={item.bullets.join('\n')}
            onChange={(e) => onChange({ ...item, bullets: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            rows={4}
            className="w-full bg-white border border-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder={'Led migration of legacy app to React and TypeScript, reducing bundle size by 42%\nBuilt design system used across 6 products serving 10K+ users'}
          />
        </FieldRow>
      </div>
    </div>
  );
}

function EducationEditor({ item, onChange }: { item: Education; onChange: (next: Education) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <FieldRow label="Degree"><TextInput value={item.degree}   onChange={(v) => onChange({ ...item, degree: v })}   placeholder="B.S. Computer Science" /></FieldRow>
      <FieldRow label="School"><TextInput value={item.school}   onChange={(v) => onChange({ ...item, school: v })}   placeholder="UC Berkeley" /></FieldRow>
      <FieldRow label="Location"><TextInput value={item.location} onChange={(v) => onChange({ ...item, location: v })} placeholder="Berkeley, CA" /></FieldRow>
      <FieldRow label="GPA (optional)"><TextInput value={item.gpa || ''} onChange={(v) => onChange({ ...item, gpa: v })} placeholder="3.8" /></FieldRow>
      <FieldRow label="Start (YYYY-MM)"><TextInput value={item.startDate} onChange={(v) => onChange({ ...item, startDate: v })} placeholder="2014-09" /></FieldRow>
      <FieldRow label="End (YYYY-MM)"><TextInput value={item.endDate}     onChange={(v) => onChange({ ...item, endDate: v })}   placeholder="2018-05" /></FieldRow>
    </div>
  );
}

function ProjectEditor({ item, onChange }: { item: Project; onChange: (next: Project) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <FieldRow label="Project Name"><TextInput value={item.name} onChange={(v) => onChange({ ...item, name: v })} placeholder="OpenChart" /></FieldRow>
      <FieldRow label="Tech Stack"><TextInput value={item.tech}     onChange={(v) => onChange({ ...item, tech: v })} placeholder="TypeScript, React, D3" /></FieldRow>
      <div className="col-span-1 sm:col-span-2">
        <FieldRow label="Description">
          <textarea
            value={item.description}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Open-source charting library used by 200+ projects."
          />
        </FieldRow>
      </div>
      <div className="col-span-1 sm:col-span-2">
        <FieldRow label="Link"><TextInput value={item.link || ''} onChange={(v) => onChange({ ...item, link: v })} placeholder="github.com/you/project" /></FieldRow>
      </div>
    </div>
  );
}

function CertEditor({ item, onChange }: { item: Certification; onChange: (next: Certification) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <FieldRow label="Name"><TextInput value={item.name}   onChange={(v) => onChange({ ...item, name: v })}   placeholder="AWS Cloud Practitioner" /></FieldRow>
      <FieldRow label="Issuer"><TextInput value={item.issuer} onChange={(v) => onChange({ ...item, issuer: v })} placeholder="Amazon" /></FieldRow>
      <FieldRow label="Date"><TextInput value={item.date}    onChange={(v) => onChange({ ...item, date: v })}    placeholder="2023-06" /></FieldRow>
    </div>
  );
}

/* ============================================================
   SKILLS CARD
============================================================ */

function SkillsCard({ resume, onChange }: { resume: ResumeData; onChange: (r: ResumeData) => void }) {
  const set = (key: keyof ResumeData['skills'], list: string[]) => onChange({ ...resume, skills: { ...resume.skills, [key]: list } });
  return (
    <Card>
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <Wrench className="w-4 h-4 text-slate-500" />
        <h3 className="font-bold text-slate-900 text-sm flex-1">Skills</h3>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SkillField label="Technical" value={resume.skills.technical} onChange={(v) => set('technical', v)} />
        <SkillField label="Tools"     value={resume.skills.tools}     onChange={(v) => set('tools', v)} />
        <SkillField label="Soft"      value={resume.skills.soft}      onChange={(v) => set('soft', v)} />
        <SkillField label="Languages" value={resume.skills.languages} onChange={(v) => set('languages', v)} />
      </div>
    </Card>
  );
}

function SkillField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '));
  // Keep local state in sync if parent value array changes (e.g. autofix / AI rewrite)
  useEffect(() => { setText(value.join(', ')); }, [value]);
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{label}</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text.split(',').map((s) => s.trim()).filter(Boolean))}
        placeholder="Comma-separated…"
        className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

/* ============================================================
   ADD-CONTENT MODAL
============================================================ */

function AddContentModal({ resume, onChange, onClose }: { resume: ResumeData; onChange: (r: ResumeData) => void; onClose: () => void }) {
  const add = (type: AddType) => {
    let next: ResumeData = resume;
    switch (type) {
      case 'experience':
        next = { ...resume, experience: [...resume.experience, { id: cryptoRandomId(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] };
        break;
      case 'education':
        next = { ...resume, education: [...resume.education, { id: cryptoRandomId(), degree: '', school: '', location: '', startDate: '', endDate: '' }] };
        break;
      case 'skills':
        next = { ...resume, skills: { ...resume.skills, technical: resume.skills.technical.length === 0 ? ['New Skill'] : resume.skills.technical } };
        break;
      case 'projects':
        next = { ...resume, projects: [...resume.projects, { id: cryptoRandomId(), name: '', description: '', tech: '', link: '' }] };
        break;
      case 'certifications':
        next = { ...resume, certifications: [...resume.certifications, { id: cryptoRandomId(), name: '', issuer: '', date: '' }] };
        break;
      case 'languages':
        next = { ...resume, skills: { ...resume.skills, languages: resume.skills.languages.length === 0 ? ['English (Native)'] : resume.skills.languages } };
        break;
      case 'hobbies':
      case 'references':
      case 'custom':
        // For these we leverage the certifications array with a label hint; they'll show up as a section.
        // (Full custom section support requires extending the data model.)
        alert(`"${ADD_OPTIONS.find((o) => o.type === type)?.label}" sections are coming soon — for now please use the Custom field via the editor.`);
        onClose();
        return;
    }
    onChange(next);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Add a section</h3>
            <p className="text-xs text-slate-500">Pick what to add to your resume.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
          {ADD_OPTIONS.map((o) => (
            <button
              key={o.type}
              onClick={() => add(o.type)}
              className="text-left bg-white border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 hover:shadow-md transition group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${o.color} text-white flex items-center justify-center mb-2 group-hover:scale-105 transition`}>{o.icon}</div>
              <div className="font-semibold text-slate-900 text-sm">{o.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{o.desc}</div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
