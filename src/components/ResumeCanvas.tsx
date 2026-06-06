import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Wraps the .resume-paper preview and scales it down to fit the parent's
 * width while preserving the 8.5×11 layout. Replaces the previous fragile
 * CSS-media-query transform trick which broke on mobile.
 */
export default function ResumeCanvas({ children, maxScale = 1, paperWidthIn = 8.5 }: { children: ReactNode; maxScale?: number; paperWidthIn?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  const paperWidthPx = paperWidthIn * 96; // 1in ≈ 96px in CSS

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (!w) return;
      const s = Math.min(maxScale, w / paperWidthPx);
      setScale(s);
      // Compute scaled height from real DOM height of the inner paper
      const inner = innerRef.current?.firstElementChild as HTMLElement | null;
      if (inner) {
        setHeight(inner.offsetHeight * s);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Also recompute when inner content size changes
    if (innerRef.current?.firstElementChild) {
      ro.observe(innerRef.current.firstElementChild as Element);
    }
    return () => ro.disconnect();
  }, [maxScale, paperWidthPx, children]);

  // Recompute height after fonts load (initial render measurements may be wrong)
  useEffect(() => {
    const t = setTimeout(() => {
      const inner = innerRef.current?.firstElementChild as HTMLElement | null;
      if (inner) setHeight(inner.offsetHeight * scale);
    }, 60);
    return () => clearTimeout(t);
  }, [scale, children]);

  return (
    <div ref={containerRef} className="resume-canvas" style={{ height: height ?? undefined }}>
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${paperWidthPx}px` }}
      >
        {children}
      </div>
    </div>
  );
}
