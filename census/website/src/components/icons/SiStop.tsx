import type { SVGProps } from 'react';
const SiStop = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <rect
      width={12.5}
      height={12.5}
      x={5.75}
      y={5.75}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      rx={1}
    />
  </svg>
);
export default SiStop;
