import type { Template } from '../lib/templateEngine';

interface Props {
  template: Template;
  className?: string;
  showName?: boolean;
}

/**
 * Lightweight SVG thumbnail that visualizes a template's layout, colors,
 * header style, and section style WITHOUT rendering the full preview.
 * This lets us display 500+ thumbnails smoothly.
 */
export default function TemplateThumbnail({ template, className = '' }: Props) {
  const t = template;
  const W = 200;
  const H = 264; // letter-ish ratio
  const p = t.theme.primary;
  const s = t.theme.secondary;
  const text = t.theme.textOnPrimary;

  const layout = t.layout;

  // Helpers
  const headerColor = ['header-card', 'executive-banner', 'hybrid-header-side'].includes(layout) ? p : '#0f172a';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* paper */}
      <rect width={W} height={H} fill="#fff" />

      {/* === LAYOUT === */}
      {layout === 'sidebar-left' && (
        <>
          <rect x={0} y={0} width={W * 0.36} height={H} fill={s ? p : p} />
          {s && <rect x={0} y={0} width={W * 0.36} height={H} fill={`url(#g-${t.id})`} />}
          <SidebarShapes x={0} w={W * 0.36} h={H} text={text} />
          <MainShapes x={W * 0.38} w={W * 0.6} y={20} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'sidebar-right' && (
        <>
          <rect x={W * 0.64} y={0} width={W * 0.36} height={H} fill={p} />
          <SidebarShapes x={W * 0.64} w={W * 0.36} h={H} text={text} />
          <MainShapes x={W * 0.04} w={W * 0.56} y={20} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {(layout === 'header-card' || layout === 'hybrid-header-side') && (
        <>
          <rect x={0} y={0} width={W} height={48} fill={p} />
          {s && <rect x={0} y={0} width={W} height={48} fill={`url(#g-${t.id})`} />}
          <text x={10} y={28} fontSize={13} fontWeight={800} fill={text} fontFamily="Inter, sans-serif">{abbr(t.name, 18)}</text>
          <line x1={10} y1={36} x2={W - 10} y2={36} stroke={text} strokeOpacity={0.3} />
          <text x={10} y={44} fontSize={6} fill={text} opacity={0.85}>email · phone · location</text>
          {layout === 'hybrid-header-side' ? (
            <>
              <MainShapes x={10} w={W * 0.62 - 10} y={62} p={p} s={s} sectionStyle={t.sectionStyle} />
              <rect x={W * 0.66} y={56} width={W * 0.34 - 4} height={H - 60} fill="#f8fafc" />
              <SidebarShapes x={W * 0.66 + 2} w={W * 0.34 - 8} h={H - 64} text="#1f2937" />
            </>
          ) : (
            <MainShapes x={10} w={W - 20} y={62} p={p} s={s} sectionStyle={t.sectionStyle} />
          )}
        </>
      )}

      {layout === 'executive-banner' && (
        <>
          <rect x={0} y={0} width={W} height={64} fill={p} />
          {s && <rect x={0} y={0} width={W} height={64} fill={`url(#g-${t.id})`} />}
          <text x={W / 2} y={32} fontSize={15} fontWeight={900} fill={text} fontFamily="Inter, sans-serif" textAnchor="middle">{abbr(t.name, 16)}</text>
          <text x={W / 2} y={46} fontSize={6} fill={text} opacity={0.85} textAnchor="middle">SENIOR PROFESSIONAL</text>
          <line x1={W / 2 - 24} y1={54} x2={W / 2 + 24} y2={54} stroke={text} strokeOpacity={0.5} />
          <MainShapes x={10} w={W - 20} y={78} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'split-header' && (
        <>
          <rect x={0} y={0} width={W * 0.55} height={48} fill={p} />
          <rect x={W * 0.55} y={0} width={W * 0.45} height={48} fill={s || '#f1f5f9'} />
          <text x={10} y={28} fontSize={11} fontWeight={800} fill={text}>{abbr(t.name, 14)}</text>
          <CircleDots x={W * 0.6} y={16} w={W * 0.35} color="#1f2937" />
          <MainShapes x={10} w={W - 20} y={62} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'monogram' && (
        <>
          <circle cx={24} cy={24} r={16} fill={p} />
          {s && <circle cx={24} cy={24} r={16} fill={`url(#g-${t.id})`} />}
          <text x={24} y={28} fontSize={11} fill={text} textAnchor="middle" fontWeight={800}>{initials(t.name)}</text>
          <text x={48} y={20} fontSize={11} fontWeight={800} fill="#0f172a">{abbr(t.name, 18)}</text>
          <text x={48} y={30} fontSize={6} fill="#475569">Job Title</text>
          <line x1={10} y1={50} x2={W - 10} y2={50} stroke={p} strokeWidth={1.2} />
          <MainShapes x={10} w={W - 20} y={62} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'centered' && (
        <>
          <text x={W / 2} y={32} fontSize={14} fontWeight={800} fill={p} textAnchor="middle">{abbr(t.name, 16)}</text>
          <line x1={W / 2 - 28} y1={40} x2={W / 2 + 28} y2={40} stroke={p} strokeWidth={1.2} />
          <text x={W / 2} y={50} fontSize={6} fill="#64748b" textAnchor="middle">email · phone · location</text>
          <MainShapes x={10} w={W - 20} y={66} p={p} s={s} sectionStyle={t.sectionStyle} centered />
        </>
      )}

      {layout === 'timeline' && (
        <>
          <ClassicHeader p={p} W={W} name={t.name} />
          <line x1={20} y1={70} x2={20} y2={H - 12} stroke={p} strokeWidth={1.2} />
          {[78, 116, 154, 192].map((y, i) => (
            <g key={i}>
              <circle cx={20} cy={y} r={3} fill={p} />
              <rect x={30} y={y - 4} width={W * 0.55} height={4} fill="#1f2937" rx={1} />
              <rect x={30} y={y + 4} width={W * 0.4} height={3} fill="#94a3b8" rx={1} />
            </g>
          ))}
        </>
      )}

      {layout === 'accent-strip-left' && (
        <>
          <rect x={0} y={0} width={6} height={H} fill={p} />
          {s && <rect x={0} y={0} width={6} height={H} fill={`url(#g-${t.id})`} />}
          <ClassicHeader p={p} W={W - 18} name={t.name} xOffset={14} />
          <MainShapes x={14} w={W - 24} y={66} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'accent-strip-top' && (
        <>
          <rect x={0} y={0} width={W} height={6} fill={p} />
          {s && <rect x={0} y={0} width={W} height={6} fill={`url(#g-${t.id})`} />}
          <ClassicHeader p={p} W={W - 20} name={t.name} y={20} />
          <MainShapes x={10} w={W - 20} y={66} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {layout === 'magazine' && (
        <>
          <text x={10} y={14} fontSize={5} fill="#94a3b8" letterSpacing="1.5">— CURRICULUM VITÆ —</text>
          <text x={10} y={36} fontSize={18} fontWeight={900} fill={p}>{abbr(t.name, 14)}</text>
          <line x1={10} y1={48} x2={W - 10} y2={48} stroke={p} strokeWidth={2} />
          <text x={10} y={58} fontSize={6} fill="#1f2937" fontStyle="italic">Senior Role · Contact line</text>
          <MainShapes x={10} w={W * 0.6 - 12} y={70} p={p} s={s} sectionStyle="plain" />
          <line x1={W * 0.62} y1={66} x2={W * 0.62} y2={H - 10} stroke={p} strokeWidth={1.2} />
          <SidebarMini x={W * 0.66} y={70} w={W * 0.32} color={p} />
        </>
      )}

      {layout === 'card-stack' && (
        <>
          <rect x={0} y={0} width={W} height={H} fill="#f8fafc" />
          <CardRect x={8} y={8} w={W - 16} h={42} accent={p} />
          <CardRect x={8} y={56} w={W - 16} h={56} accent={p} />
          <CardRect x={8} y={118} w={(W - 22) / 2} h={56} accent={p} />
          <CardRect x={8 + (W - 22) / 2 + 6} y={118} w={(W - 22) / 2} h={56} accent={p} />
          <CardRect x={8} y={180} w={W - 16} h={H - 188} accent={p} />
        </>
      )}

      {layout === 'compact-ats' && (
        <>
          <text x={10} y={20} fontSize={11} fontWeight={800} fill="#000">{abbr(t.name, 22)}</text>
          <text x={10} y={28} fontSize={5} fill="#475569">email · phone · location · linkedin</text>
          {[40, 78, 116, 154, 192, 230].map((y, i) => (
            <g key={i}>
              <line x1={10} y1={y} x2={W - 10} y2={y} stroke="#000" strokeWidth={0.6} />
              <rect x={10} y={y + 3} width={48} height={4} fill="#000" />
              <rect x={10} y={y + 11} width={W - 20} height={2.5} fill="#475569" />
              <rect x={10} y={y + 17} width={W - 30} height={2.5} fill="#475569" />
              <rect x={10} y={y + 23} width={W - 40} height={2.5} fill="#475569" />
            </g>
          ))}
        </>
      )}

      {layout === 'single' && (
        <>
          <ClassicHeader p={p} W={W - 20} name={t.name} />
          <MainShapes x={10} w={W - 20} y={66} p={p} s={s} sectionStyle={t.sectionStyle} />
        </>
      )}

      {/* gradient definition (used by sidebars/headers if secondary exists) */}
      {s && (
        <defs>
          <linearGradient id={`g-${t.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={p} />
            <stop offset="1" stopColor={s} />
          </linearGradient>
        </defs>
      )}

      {/* Subtle paper border */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke="#e2e8f0" />

      {/* Reference unused names to suppress warning in monogram path */}
      {false && headerColor}
    </svg>
  );
}

/* ============== Helpers (SVG shapes) ============== */

function abbr(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'CV';
}

function ClassicHeader({ p, W, name, xOffset = 10, y = 22 }: { p: string; W: number; name: string; xOffset?: number; y?: number }) {
  return (
    <g>
      <text x={xOffset} y={y} fontSize={13} fontWeight={800} fill={p}>{abbr(name, 22)}</text>
      <text x={xOffset} y={y + 10} fontSize={6} fill="#64748b">Senior Professional</text>
      <text x={xOffset} y={y + 20} fontSize={5} fill="#475569">email · phone · location · linkedin</text>
      <line x1={xOffset} y1={y + 28} x2={xOffset + W - 10} y2={y + 28} stroke={p} strokeWidth={0.8} />
    </g>
  );
}

function SidebarShapes({ x, w, h, text }: { x: number; w: number; h: number; text: string }) {
  const fill = text === '#fff' ? '#ffffff' : '#1f2937';
  const fillSoft = text === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  const lines: React.ReactNode[] = [];
  let y = 14;
  // monogram-ish initials box
  lines.push(<rect key="n" x={x + 8} y={y} width={w - 16} height={6} fill={fill} />);
  y += 12;
  lines.push(<rect key="r" x={x + 8} y={y} width={w - 28} height={3} fill={fillSoft} />);
  y += 12;
  // Sections
  for (let s = 0; s < 4; s++) {
    lines.push(<rect key={`h${s}`} x={x + 8} y={y} width={w * 0.5} height={3} fill={fill} />);
    y += 8;
    for (let r = 0; r < 4; r++) {
      lines.push(<rect key={`r${s}-${r}`} x={x + 8} y={y} width={w - 18 - r * 5} height={2} fill={fillSoft} />);
      y += 5;
    }
    y += 6;
    if (y > h - 12) break;
  }
  return <>{lines}</>;
}

function MainShapes({ x, w, y, p, sectionStyle, centered }: { x: number; w: number; y: number; p: string; s?: string; sectionStyle: string; centered?: boolean }) {
  const shapes: React.ReactNode[] = [];
  let cy = y;
  for (let sec = 0; sec < 4; sec++) {
    // Section heading flavor
    const titleW = 40;
    if (sectionStyle === 'pill') {
      shapes.push(<rect key={`p${sec}`} x={x} y={cy - 5} width={titleW + 8} height={8} rx={4} fill={p} />);
    } else if (sectionStyle === 'bar') {
      shapes.push(<rect key={`b${sec}`} x={x} y={cy - 5} width={2.5} height={6} fill={p} />);
      shapes.push(<rect key={`bt${sec}`} x={x + 5} y={cy - 3} width={titleW} height={3} fill={p} />);
    } else if (sectionStyle === 'plain') {
      shapes.push(<rect key={`pt${sec}`} x={centered ? x + (w - titleW) / 2 : x} y={cy - 3} width={titleW} height={3} fill={p} />);
    } else if (sectionStyle === 'double') {
      const tx = x + (w - titleW) / 2;
      shapes.push(<rect key={`dt${sec}`} x={tx} y={cy - 3} width={titleW} height={3} fill={p} />);
      shapes.push(<line key={`dl1${sec}`} x1={x + (w - titleW) / 2 - 14} y1={cy + 3} x2={x + (w - titleW) / 2 - 2} y2={cy + 3} stroke={p} strokeWidth={0.6} />);
      shapes.push(<line key={`dl2${sec}`} x1={x + (w + titleW) / 2 + 2} y1={cy + 3} x2={x + (w + titleW) / 2 + 14} y2={cy + 3} stroke={p} strokeWidth={0.6} />);
    } else if (sectionStyle === 'boxed') {
      shapes.push(<rect key={`bx${sec}`} x={x} y={cy - 6} width={titleW + 6} height={9} fill="none" stroke={p} strokeWidth={0.8} />);
    } else if (sectionStyle === 'numbered') {
      shapes.push(<text key={`n${sec}`} x={x} y={cy + 1} fontSize={6} fill={p} fontWeight={900}>0{sec + 1}</text>);
      shapes.push(<rect key={`nt${sec}`} x={x + 12} y={cy - 2} width={titleW} height={3} fill={p} />);
    } else if (sectionStyle === 'left-rule') {
      shapes.push(<rect key={`lt${sec}`} x={x} y={cy - 2} width={titleW} height={3} fill={p} />);
      shapes.push(<line key={`lr${sec}`} x1={x + titleW + 4} y1={cy} x2={x + w - 4} y2={cy} stroke={p} strokeOpacity={0.4} strokeWidth={0.6} />);
    } else {
      // underline
      shapes.push(<rect key={`u${sec}`} x={x} y={cy - 3} width={titleW} height={3} fill={p} />);
      shapes.push(<line key={`ul${sec}`} x1={x} y1={cy + 2} x2={x + w} y2={cy + 2} stroke={p} strokeWidth={0.8} />);
    }
    cy += 10;
    // body content lines
    for (let r = 0; r < 3; r++) {
      shapes.push(<rect key={`c${sec}-${r}`} x={x} y={cy} width={w - r * 12 - (sec === 1 ? 5 : 0)} height={2.5} fill="#475569" rx={0.5} />);
      cy += 5;
    }
    cy += 8;
    if (cy > 240) break;
  }
  return <>{shapes}</>;
}

function CircleDots({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  return (
    <g>
      <text x={x} y={y} fontSize={5} fill={color} fontWeight={700}>CONTACT</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={x + 3} cy={y + 8 + i * 5} r={1.2} fill={color} />
          <rect x={x + 7} y={y + 7 + i * 5} width={w - 16} height={1.8} fill={color} opacity={0.6} />
        </g>
      ))}
    </g>
  );
}

function CardRect({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#fff" stroke="rgba(0,0,0,0.06)" />
      <rect x={x + 6} y={y + 6} width={24} height={3} fill={accent} />
      <rect x={x + 6} y={y + 13} width={w - 16} height={2} fill="#94a3b8" />
      <rect x={x + 6} y={y + 18} width={w - 24} height={2} fill="#cbd5e1" />
      {h > 30 && <rect x={x + 6} y={y + 23} width={w - 32} height={2} fill="#cbd5e1" />}
      {h > 40 && <rect x={x + 6} y={y + 28} width={w - 20} height={2} fill="#cbd5e1" />}
      {h > 50 && <rect x={x + 6} y={y + 33} width={w - 40} height={2} fill="#cbd5e1" />}
    </g>
  );
}

function SidebarMini({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  const out: React.ReactNode[] = [];
  let cy = y;
  for (let s = 0; s < 4; s++) {
    out.push(<rect key={`m${s}`} x={x} y={cy} width={w * 0.6} height={3} fill={color} />);
    cy += 7;
    for (let i = 0; i < 3; i++) {
      out.push(<rect key={`mi${s}-${i}`} x={x} y={cy} width={w - i * 8} height={2} fill="#475569" />);
      cy += 4;
    }
    cy += 6;
  }
  return <>{out}</>;
}
