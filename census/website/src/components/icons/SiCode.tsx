import type { SVGProps } from 'react';
const SiCode = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <rect
      width={14.5}
      height={14.5}
      x={4.75}
      y={4.75}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      rx={2}
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.75 10.75L11.25 13L8.75 15.25"
    />
  </svg>
);
export default SiCode;
