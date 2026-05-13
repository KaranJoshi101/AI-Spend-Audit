import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.1,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const fromValueRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const target = Number.isFinite(value) ? value : 0;
    const from = fromValueRef.current;

    const tick = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      const eased = 1 - Math.pow(1 - Math.min(elapsed, 1), 3);
      const current = from + (target - from) * eased;
      setDisplayValue(current);

      if (elapsed < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        fromValueRef.current = target;
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
