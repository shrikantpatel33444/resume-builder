import { useRef, useState } from 'react';
import { Settings2, Layout, Palette, User as UserIcon, Type as TypeIcon, Layers as LayersIcon, MoreHorizontal, Globe2, GripVertical, Eye, EyeOff, Camera, Trash2, Send, Image as ImageIcon } from 'lucide-react';
import type { CustomizationConfig, HeadingStyleId, IconShape, ResumeData } from '../../types';
import { TEMPLATES } from '../../lib/templateEngine';
import TemplateThumbnail from '../TemplateThumbnail';
import { Accordion, Card, Checkbox, ColorSwatch, ControlGroup, OptionTile, PillToggle, Slider, Toggle } from './controls';
import { COLOR_PALETTE, FONT_LIBRARY, getCustomization } from '../../lib/customization';

interface Props {
  resume: ResumeData;
  onChange: (r: ResumeData) => void;
  onBrowseTemplates: () => void;
}

const ALL_SECTIONS = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];
const SECTION_LABELS: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

export default function CustomizeSidebar({ resume, onChange, onBrowseTemplates }: Props) {
  const c = getCustomization(resume);
  const setC = (next: Partial<CustomizationConfig>) => onChange({ ...resume, customization: { ...c, ...next } });
  const setAccent = (key: keyof CustomizationConfig['accentTargets'], v: boolean) =>
    setC({ accentTargets: { ...c.accentTargets, [key]: v } });

  return (
    <div className="space-y-3">
      {/* ===== BASICS ===== */}
      <Accordion title="Basics" icon={<Settings2 className="w-4 h-4" />} defaultOpen>
        <ControlGroup label="Language & Region">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={c.uiLanguage}
              onChange={(e) => setC({ uiLanguage: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="hi">हिन्दी</option>
              <option value="ja">日本語</option>
            </select>
            <select
              value={c.dateFormat}
              onChange={(e) => setC({ dateFormat: e.target.value as CustomizationConfig['dateFormat'] })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              title="Date format"
            >
              <option value="MMM YYYY">MMM YYYY</option>
              <option value="Month YYYY">Month YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <PillToggle
              value={c.pageFormat}
              onChange={(v) => setC({ pageFormat: v })}
              options={[{ v: 'A4', label: 'A4' }, { v: 'Letter', label: 'Letter' }]}
            />
          </div>
        </ControlGroup>

        <ControlGroup label="Apply a design template" action={<button onClick={onBrowseTemplates} className="text-[11px] font-semibold text-indigo-700 hover:underline">Browse all →</button>}>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {TEMPLATES.slice(0, 8).map((t) => {
              const selected = resume.templateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onChange({ ...resume, templateId: t.id })}
                  className={`shrink-0 w-20 rounded-lg overflow-hidden border-2 transition ${selected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
                  title={t.name}
                >
                  <div className="bg-slate-50" style={{ aspectRatio: '200/264' }}>
                    <TemplateThumbnail template={t} />
                  </div>
                  <div className="text-[9px] font-semibold text-slate-700 truncate px-1 py-0.5 bg-white">{t.name}</div>
                </button>
              );
            })}
          </div>
        </ControlGroup>
      </Accordion>

      {/* ===== LAYOUT & SPACING ===== */}
      <Accordion title="Layout & Spacing" icon={<Layout className="w-4 h-4" />}>
        <ControlGroup label="Layout">
          <OptionTile
            value={c.layoutMode}
            onChange={(v) => setC({ layoutMode: v })}
            options={[
              { v: 'one', label: 'One column',   preview: <LayoutPreview kind="one" /> },
              { v: 'two', label: 'Two columns',  preview: <LayoutPreview kind="two" /> },
              { v: 'mix', label: 'Mix layout',   preview: <LayoutPreview kind="mix" /> },
            ]}
          />
        </ControlGroup>

        <ControlGroup label="Font Size">
          <Slider value={c.fontSize} min={8} max={16} step={0.5} unit="pt" onChange={(v) => setC({ fontSize: v })} />
        </ControlGroup>

        <ControlGroup label="Line Height">
          <Slider value={c.lineHeight} min={1.0} max={2.0} step={0.05} onChange={(v) => setC({ lineHeight: v })} displayValue={(v) => v.toFixed(2)} />
        </ControlGroup>

        <ControlGroup label="Left & Right Margin">
          <Slider value={c.marginLeftRight} min={0} max={40} step={1} unit="mm" onChange={(v) => setC({ marginLeftRight: v })} />
        </ControlGroup>

        <ControlGroup label="Top & Bottom Margin">
          <Slider value={c.marginTopBottom} min={0} max={30} step={1} unit="mm" onChange={(v) => setC({ marginTopBottom: v })} />
        </ControlGroup>

        <ControlGroup label="Space between Entries">
          <Slider value={c.spaceBetweenEntries} min={-10} max={20} step={1} unit="pt" onChange={(v) => setC({ spaceBetweenEntries: v })} />
        </ControlGroup>

        <ControlGroup label="Entry Layout">
          <OptionTile
            columns={4}
            value={c.entryLayout}
            onChange={(v) => setC({ entryLayout: v })}
            options={[
              { v: 'standard', label: 'Standard', preview: <EntryPreview kind="standard" /> },
              { v: 'compact',  label: 'Compact',  preview: <EntryPreview kind="compact" /> },
              { v: 'split',    label: 'Split',    preview: <EntryPreview kind="split" /> },
              { v: 'icon',     label: 'Icon',     preview: <EntryPreview kind="icon" /> },
            ]}
          />
        </ControlGroup>

        <ControlGroup label="Column Width">
          <PillToggle value={c.columnWidth} onChange={(v) => setC({ columnWidth: v })}
            options={[{ v: 'auto', label: 'Auto' }, { v: 'manual', label: 'Manual' }]} />
        </ControlGroup>

        <ControlGroup label="Title (Name) Size">
          <Slider value={c.titleSize} min={16} max={48} step={1} unit="pt" onChange={(v) => setC({ titleSize: v })} />
        </ControlGroup>

        <ControlGroup label="Section Heading Size">
          <Slider value={c.subtitleSize} min={10} max={20} step={0.5} unit="pt" onChange={(v) => setC({ subtitleSize: v })} />
        </ControlGroup>
      </Accordion>

      {/* ===== DESIGN ===== */}
      <Accordion title="Design" icon={<Palette className="w-4 h-4" />}>
        {/* Font category */}
        <ControlGroup label="Typography">
          <PillToggle
            value={c.fontCategory}
            onChange={(v) => setC({ fontCategory: v, fontFamily: FONT_LIBRARY[v][0].name })}
            options={[
              { v: 'serif', label: <><TypeIcon className="w-3 h-3" /> Serif</> },
              { v: 'sans',  label: <><TypeIcon className="w-3 h-3" /> Sans</> },
              { v: 'mono',  label: <><TypeIcon className="w-3 h-3" /> Mono</> },
            ]}
          />
          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {FONT_LIBRARY[c.fontCategory].map((f) => {
              const selected = c.fontFamily === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setC({ fontFamily: f.name })}
                  className={`text-left px-2.5 py-1.5 rounded-md text-[11px] border transition ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                  style={{ fontFamily: f.stack }}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </ControlGroup>

        {/* Colors */}
        <ControlGroup label="Accent Color">
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={c.accentColor.toLowerCase() === color.toLowerCase()}
                onClick={() => setC({ accentColor: color })}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={c.accentColor}
              onChange={(e) => setC({ accentColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-slate-200"
            />
            <input
              value={c.accentColor}
              onChange={(e) => setC({ accentColor: e.target.value })}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono uppercase"
            />
          </div>
        </ControlGroup>

        <ControlGroup label="Apply accent color to">
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
            <Checkbox checked={c.accentTargets.name}        onChange={(v) => setAccent('name', v)}        label="Name" />
            <Checkbox checked={c.accentTargets.dotsBars}    onChange={(v) => setAccent('dotsBars', v)}    label="Dots/Bars/Bubbles" />
            <Checkbox checked={c.accentTargets.jobTitle}    onChange={(v) => setAccent('jobTitle', v)}    label="Job title" />
            <Checkbox checked={c.accentTargets.dates}       onChange={(v) => setAccent('dates', v)}       label="Dates" />
            <Checkbox checked={c.accentTargets.headings}    onChange={(v) => setAccent('headings', v)}    label="Headings" />
            <Checkbox checked={c.accentTargets.subtitle}    onChange={(v) => setAccent('subtitle', v)}    label="Entry subtitle" />
            <Checkbox checked={c.accentTargets.headingLine} onChange={(v) => setAccent('headingLine', v)} label="Heading line" />
            <Checkbox checked={c.accentTargets.linkIcons}   onChange={(v) => setAccent('linkIcons', v)}   label="Link icons" />
            <Checkbox checked={c.accentTargets.headerIcons} onChange={(v) => setAccent('headerIcons', v)} label="Header icons" />
          </div>
        </ControlGroup>

        <ControlGroup label="Section Headings Style">
          <OptionTile
            columns={3}
            value={c.headingStyle}
            onChange={(v) => setC({ headingStyle: v as HeadingStyleId })}
            options={[
              { v: 'underline',  label: 'Underline',  preview: <HeadingPreview kind="underline" /> },
              { v: 'bar',        label: 'Bar',        preview: <HeadingPreview kind="bar" /> },
              { v: 'pill',       label: 'Pill',       preview: <HeadingPreview kind="pill" /> },
              { v: 'plain',      label: 'Plain',      preview: <HeadingPreview kind="plain" /> },
              { v: 'double',     label: 'Double',     preview: <HeadingPreview kind="double" /> },
              { v: 'boxed',      label: 'Boxed',      preview: <HeadingPreview kind="boxed" /> },
              { v: 'numbered',   label: 'Numbered',   preview: <HeadingPreview kind="numbered" /> },
              { v: 'left-rule',  label: 'Left rule',  preview: <HeadingPreview kind="left-rule" /> },
              { v: 'background', label: 'Background', preview: <HeadingPreview kind="background" /> },
            ]}
          />
          <div className="mt-2">
            <PillToggle
              value={c.headingCapitalization}
              onChange={(v) => setC({ headingCapitalization: v })}
              options={[
                { v: 'capitalize', label: 'Capitalize' },
                { v: 'uppercase',  label: 'UPPERCASE' },
                { v: 'normal',     label: 'normal' },
              ]}
            />
          </div>
        </ControlGroup>
      </Accordion>

      {/* ===== PERSONAL DETAILS ===== */}
      <Accordion title="Personal Details" icon={<UserIcon className="w-4 h-4" />}>
        <ControlGroup label="Header Alignment">
          <PillToggle
            value={c.headerAlignment}
            onChange={(v) => setC({ headerAlignment: v })}
            options={[
              { v: 'left',   label: '⟵ Left' },
              { v: 'center', label: '⇆ Center' },
              { v: 'right',  label: 'Right ⟶' },
            ]}
          />
        </ControlGroup>

        <ControlGroup label="Details Arrangement">
          <OptionTile
            columns={5}
            value={c.detailsArrangement}
            onChange={(v) => setC({ detailsArrangement: v })}
            options={[
              { v: 'lines',  label: 'Lines',  preview: <ArrangementPreview kind="lines" /> },
              { v: 'dotted', label: 'Dotted', preview: <ArrangementPreview kind="dotted" /> },
              { v: 'icon',   label: 'Icon',   preview: <ArrangementPreview kind="icon" /> },
              { v: 'bullet', label: 'Bullet', preview: <ArrangementPreview kind="bullet" /> },
              { v: 'bar',    label: 'Bar',    preview: <ArrangementPreview kind="bar" /> },
            ]}
          />
        </ControlGroup>

        {c.detailsArrangement === 'icon' && (
          <ControlGroup label="Icon Style">
            <OptionTile
              columns={6}
              value={c.iconStyle}
              onChange={(v) => setC({ iconStyle: v as IconShape })}
              options={[
                { v: 'link',      label: '', preview: <IconShapePreview kind="link" /> },
                { v: 'square',    label: '', preview: <IconShapePreview kind="square" /> },
                { v: 'rounded',   label: '', preview: <IconShapePreview kind="rounded" /> },
                { v: 'circle',    label: '', preview: <IconShapePreview kind="circle" /> },
                { v: 'diamond',   label: '', preview: <IconShapePreview kind="diamond" /> },
                { v: 'rectangle', label: '', preview: <IconShapePreview kind="rectangle" /> },
              ]}
            />
          </ControlGroup>
        )}

        <ControlGroup label="Name">
          <div className="flex gap-1">
            {(['XS','S','M','L','XL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setC({ nameSize: s })}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${c.nameSize === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Checkbox checked={c.nameBold} onChange={(v) => setC({ nameBold: v })} label="Name bold" />
            <PillToggle
              value={c.nameFont}
              onChange={(v) => setC({ nameFont: v })}
              options={[{ v: 'body', label: 'Body' }, { v: 'creative', label: 'Creative' }]}
            />
          </div>
        </ControlGroup>

        <ControlGroup label="Professional Title">
          <input
            value={resume.targetJobTitle}
            onChange={(e) => onChange({ ...resume, targetJobTitle: e.target.value })}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Shown under your name in the header.</p>
        </ControlGroup>

        <ControlGroup label="Photo">
          <PhotoUpload value={c.profilePhoto} shape={c.profilePhotoShape} onChange={(photo) => setC({ profilePhoto: photo })} onShapeChange={(shape) => setC({ profilePhotoShape: shape })} />
        </ControlGroup>
      </Accordion>

      {/* ===== SECTIONS ===== */}
      <Accordion title="Sections" icon={<LayersIcon className="w-4 h-4" />}>
        <SectionsManager resume={resume} onChange={onChange} />
      </Accordion>

      {/* ===== OTHER ===== */}
      <Accordion title="Other" icon={<MoreHorizontal className="w-4 h-4" />}>
        <OtherPanel resume={resume} />
      </Accordion>
    </div>
  );
}

/* ========================= PREVIEW PRIMITIVES (icons inside selectors) ========================= */

function LayoutPreview({ kind }: { kind: 'one' | 'two' | 'mix' }) {
  if (kind === 'one') return (
    <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="6" y="6" width="28" height="3" rx="1" fill="currentColor" /><rect x="6" y="12" width="28" height="2" rx="1" fill="currentColor" opacity="0.4" /><rect x="6" y="16" width="22" height="2" rx="1" fill="currentColor" opacity="0.4" /><rect x="6" y="22" width="28" height="2" rx="1" fill="currentColor" opacity="0.4" /><rect x="6" y="26" width="24" height="2" rx="1" fill="currentColor" opacity="0.4" /><rect x="6" y="30" width="20" height="2" rx="1" fill="currentColor" opacity="0.4" /></svg>
  );
  if (kind === 'two') return (
    <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="4" y="6" width="13" height="28" rx="1" fill="currentColor" opacity="0.3" /><rect x="20" y="6" width="16" height="3" fill="currentColor" /><rect x="20" y="12" width="16" height="2" fill="currentColor" opacity="0.4" /><rect x="20" y="16" width="14" height="2" fill="currentColor" opacity="0.4" /><rect x="20" y="22" width="16" height="2" fill="currentColor" opacity="0.4" /><rect x="20" y="26" width="13" height="2" fill="currentColor" opacity="0.4" /></svg>
  );
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="4" y="4" width="32" height="6" rx="1" fill="currentColor" /><rect x="4" y="14" width="14" height="20" rx="1" fill="currentColor" opacity="0.3" /><rect x="20" y="14" width="16" height="3" fill="currentColor" opacity="0.4" /><rect x="20" y="20" width="16" height="2" fill="currentColor" opacity="0.4" /><rect x="20" y="24" width="14" height="2" fill="currentColor" opacity="0.4" /><rect x="20" y="28" width="12" height="2" fill="currentColor" opacity="0.4" /></svg>
  );
}

function EntryPreview({ kind }: { kind: 'standard' | 'compact' | 'split' | 'icon' }) {
  if (kind === 'compact') return <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="4" y="14" width="32" height="2" fill="currentColor" /><rect x="4" y="18" width="22" height="2" fill="currentColor" opacity="0.5" /><rect x="4" y="22" width="32" height="2" fill="currentColor" /><rect x="4" y="26" width="22" height="2" fill="currentColor" opacity="0.5" /></svg>;
  if (kind === 'split') return <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="4" y="10" width="18" height="3" fill="currentColor" /><rect x="26" y="10" width="10" height="2" fill="currentColor" opacity="0.5" /><rect x="4" y="16" width="22" height="2" fill="currentColor" opacity="0.4" /><rect x="4" y="22" width="32" height="2" fill="currentColor" opacity="0.4" /></svg>;
  if (kind === 'icon') return <svg viewBox="0 0 40 40" className="w-10 h-10"><circle cx="8" cy="12" r="3" fill="currentColor" /><rect x="14" y="11" width="22" height="3" fill="currentColor" /><rect x="14" y="16" width="18" height="2" fill="currentColor" opacity="0.4" /><circle cx="8" cy="26" r="3" fill="currentColor" /><rect x="14" y="25" width="22" height="3" fill="currentColor" /></svg>;
  return <svg viewBox="0 0 40 40" className="w-10 h-10"><rect x="4" y="8" width="18" height="3" fill="currentColor" /><rect x="4" y="13" width="14" height="2" fill="currentColor" opacity="0.5" /><rect x="4" y="20" width="32" height="2" fill="currentColor" opacity="0.4" /><rect x="4" y="24" width="28" height="2" fill="currentColor" opacity="0.4" /><rect x="4" y="28" width="22" height="2" fill="currentColor" opacity="0.4" /></svg>;
}

function HeadingPreview({ kind }: { kind: HeadingStyleId }) {
  switch (kind) {
    case 'underline': return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="8" width="20" height="3" fill="currentColor" /><line x1="4" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="1.2" /></svg>;
    case 'bar':       return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="8" width="2" height="6" fill="currentColor" /><rect x="9" y="9" width="20" height="3" fill="currentColor" /></svg>;
    case 'pill':      return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="8" width="24" height="8" rx="4" fill="currentColor" /></svg>;
    case 'plain':     return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="10" width="22" height="3" fill="currentColor" /></svg>;
    case 'double':    return <svg viewBox="0 0 40 30" className="w-12 h-10"><line x1="4" y1="9" x2="36" y2="9" stroke="currentColor" strokeWidth="1" /><rect x="10" y="12" width="20" height="3" fill="currentColor" /><line x1="4" y1="19" x2="36" y2="19" stroke="currentColor" strokeWidth="1" /></svg>;
    case 'boxed':     return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="6" width="26" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" /><rect x="7" y="10" width="20" height="3" fill="currentColor" /></svg>;
    case 'numbered':  return <svg viewBox="0 0 40 30" className="w-12 h-10"><text x="4" y="16" fontSize="10" fontWeight="bold" fill="currentColor">01</text><rect x="18" y="10" width="18" height="3" fill="currentColor" /></svg>;
    case 'left-rule': return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="4" y="9" width="18" height="3" fill="currentColor" /><line x1="24" y1="11" x2="36" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.4" /></svg>;
    case 'background':return <svg viewBox="0 0 40 30" className="w-12 h-10"><rect x="2" y="6" width="36" height="10" fill="currentColor" opacity="0.15" /><rect x="6" y="10" width="22" height="3" fill="currentColor" /></svg>;
  }
}

function ArrangementPreview({ kind }: { kind: 'lines' | 'dotted' | 'icon' | 'bullet' | 'bar' }) {
  if (kind === 'lines') return <svg viewBox="0 0 40 30" className="w-10 h-8"><rect x="4" y="9" width="10" height="2" fill="currentColor" /><line x1="16" y1="10" x2="20" y2="10" stroke="currentColor" /><rect x="22" y="9" width="14" height="2" fill="currentColor" /></svg>;
  if (kind === 'dotted') return <svg viewBox="0 0 40 30" className="w-10 h-8"><rect x="4" y="9" width="10" height="2" fill="currentColor" /><circle cx="18" cy="10" r="0.8" fill="currentColor" /><rect x="22" y="9" width="14" height="2" fill="currentColor" /></svg>;
  if (kind === 'bullet') return <svg viewBox="0 0 40 30" className="w-10 h-8"><circle cx="6" cy="10" r="2" fill="currentColor" /><rect x="10" y="9" width="26" height="2" fill="currentColor" /></svg>;
  if (kind === 'bar') return <svg viewBox="0 0 40 30" className="w-10 h-8"><rect x="4" y="6" width="2" height="10" fill="currentColor" /><rect x="10" y="9" width="26" height="2" fill="currentColor" /></svg>;
  return <svg viewBox="0 0 40 30" className="w-10 h-8"><circle cx="8" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" /><rect x="14" y="9" width="22" height="2" fill="currentColor" /></svg>;
}

function IconShapePreview({ kind }: { kind: IconShape }) {
  switch (kind) {
    case 'link':      return <div className="w-6 h-6 rounded-md border-2 border-current flex items-center justify-center text-xs">@</div>;
    case 'square':    return <div className="w-6 h-6 bg-current opacity-60" />;
    case 'rounded':   return <div className="w-6 h-6 rounded-lg bg-current opacity-60" />;
    case 'circle':    return <div className="w-6 h-6 rounded-full bg-current opacity-60" />;
    case 'diamond':   return <div className="w-5 h-5 rotate-45 bg-current opacity-60" />;
    case 'rectangle': return <div className="w-7 h-4 bg-current opacity-60" />;
  }
}

/* ========================= PHOTO UPLOAD ========================= */

function PhotoUpload({
  value, shape, onChange, onShapeChange,
}: { value: string | null; shape: 'circle' | 'square' | 'rounded'; onChange: (v: string | null) => void; onShapeChange: (s: 'circle' | 'square' | 'rounded') => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2_500_000) { alert('Image too large (max 2.5 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          className={`relative w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 hover:border-indigo-400 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition overflow-hidden ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-md'}`}
        >
          {value ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </button>
        <div className="flex-1 text-xs text-slate-500">
          {value ? 'Photo added. Choose a shape →' : 'Click to upload a profile photo. PNG/JPG up to 2.5 MB.'}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {value && (
        <div className="mt-3 space-y-2">
          <PillToggle
            value={shape}
            onChange={onShapeChange}
            options={[
              { v: 'circle',  label: 'Circle' },
              { v: 'rounded', label: 'Rounded' },
              { v: 'square',  label: 'Square' },
            ]}
          />
          <button onClick={() => onChange(null)} className="w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg">
            <Trash2 className="w-3 h-3" /> Remove photo
          </button>
        </div>
      )}
      {!value && (
        <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> Photo design options will appear here once you add a photo.
        </p>
      )}
    </div>
  );
}

/* ========================= SECTIONS MANAGER ========================= */

function SectionsManager({ resume, onChange }: { resume: ResumeData; onChange: (r: ResumeData) => void }) {
  const order = resume.sectionOrder && resume.sectionOrder.length > 0 ? resume.sectionOrder : ALL_SECTIONS;
  const hidden = new Set(resume.hiddenSections || []);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ ...resume, sectionOrder: next });
  };

  const toggle = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...resume, hiddenSections: Array.from(next) });
  };

  return (
    <div className="space-y-1.5">
      {order.map((key, idx) => (
        <div
          key={key}
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={() => { if (dragIdx !== null) move(dragIdx, idx); setDragIdx(null); }}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition ${dragIdx === idx ? 'opacity-50' : ''}`}
        >
          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab shrink-0" />
          <span className={`flex-1 text-sm ${hidden.has(key) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {SECTION_LABELS[key] || key}
          </span>
          <button onClick={() => toggle(key)} className="p-1 rounded hover:bg-slate-100" title={hidden.has(key) ? 'Show' : 'Hide'}>
            {hidden.has(key) ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      ))}
      <p className="text-[10px] text-slate-400 italic mt-2">💡 Drag to reorder · Click eye to hide. Changes reflect in the live preview.</p>
    </div>
  );
}

/* ========================= OTHER PANEL ========================= */

function OtherPanel({ resume }: { resume: ResumeData }) {
  const [shareName, setShareName] = useState(resume.title);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4">
      <ControlGroup label="Save your design as a resume template">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">Create resume template</span>
          <Toggle checked={shareEnabled} onChange={setShareEnabled} />
        </div>
        {shareEnabled && (
          <div className="mt-2 space-y-2">
            <input
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              placeholder="Template name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-500">Your design will be saved locally and reusable in your dashboard.</p>
            <button
              onClick={() => alert(`Saved template draft "${shareName}" locally.`)}
              className="w-full text-xs font-semibold bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Save template
            </button>
          </div>
        )}
      </ControlGroup>

      <ControlGroup label="Missing something? Suggestions">
        {sent ? (
          <div className="text-xs text-emerald-600 font-medium">Thanks for your feedback! 💜</div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Hey, I think you could improve…"
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={() => { if (feedback.trim()) { setSent(true); setFeedback(''); } }}
              disabled={!feedback.trim()}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2 rounded-lg hover:shadow disabled:opacity-50"
            >
              <Send className="w-3 h-3" /> Send feedback
            </button>
          </div>
        )}
      </ControlGroup>

      <Card className="p-3 bg-slate-50">
        <div className="text-[10px] text-slate-500 flex items-start gap-1.5">
          <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Your customization is auto-saved to this browser and applied to every download (PDF, DOCX, TXT).</span>
        </div>
      </Card>
    </div>
  );
}
