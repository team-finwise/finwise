import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

/**
 * AnimatedNumber
 *
 * Tweens a numeric value from its previous rendering to the new one whenever
 * it changes, instead of snapping instantly — used anywhere a number updates
 * live in response to user input (sliders, what-if comparisons).
 *
 * Props:
 *   value   — number (raw, unformatted)
 *   format  — (number) => string   e.g. formatRupee, formatPercent, formatDelta
 *   duration — seconds (default 0.5)
 */
export default function AnimatedNumber({ value, format, duration = 0.5, ...rest }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prevValue = useRef(value ?? 0);

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      setDisplay(value);
      return;
    }
    const from = prevValue.current;
    const controls = animate(from, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = typeof display === 'number' && format ? format(display) : display;

  return <span {...rest}>{text}</span>;
}
