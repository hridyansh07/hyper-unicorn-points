import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Props {
  value: number;
  className?: string;
  style?: CSSProperties;
  suffix?: string;
}

export function AnimatedNumber({ value, className, style, suffix = 'pts' }: Props) {
  const [display, setDisplay] = useState(value);
  // Track the *currently displayed* value so a mid-tween prop change tweens
  // from where the number actually is, not from the previous start point.
  const displayRef = useRef(value);

  useEffect(() => {
    const start = displayRef.current;
    const end = value;
    const dur = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = start + (end - start) * eased;
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className={className} style={style}>
      {Math.round(display).toLocaleString()}
      <span className="text-[0.4em] text-warm-ink-faint ml-2 font-medium">{suffix}</span>
    </div>
  );
}
