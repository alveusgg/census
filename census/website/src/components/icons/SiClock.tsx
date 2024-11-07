import type { SVGProps } from 'react';
const SiClock = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx={12} cy={12} r={7.25} stroke="currentColor" strokeWidth={2} />
    <path stroke="currentColor" strokeWidth={2} d="M12 8V12L14 14" />
  </svg>
);
export default SiClock;
