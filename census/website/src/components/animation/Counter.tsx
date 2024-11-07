import { useAnimate } from 'framer-motion';
import { ComponentProps, FC, useEffect, useRef } from 'react';

interface CounterProps {
  duration: number;
  children: number;
  delay?: number;
}

export const Counter: FC<CounterProps & ComponentProps<'p'>> = ({ children, duration, delay = 0, ...props }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [, animate] = useAnimate();

  useEffect(() => {
    if (!ref.current) return;
    const initial = ref.current.textContent;
    const number = Number(initial);
    if (!initial || isNaN(number)) {
      ref.current.textContent = children.toString();
      return;
    }

    animate(number, children, {
      duration,
      onUpdate: value => {
        if (!ref.current) return;
        ref.current.textContent = Math.round(value).toString();
      },
      delay
    });
  }, [children]);

  return <p ref={ref} {...props} />;
};
