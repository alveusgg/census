import type { SVGProps } from 'react';
const SiSquareFrame = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 7.75a3 3 0 0 1 3-3h8.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-8.5a3 3 0 0 1-3-3v-8.5Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.25 7.75h-1.5a1 1 0 0 0-1 1v1.5m2.5 6h-1.5a1 1 0 0 1-1-1v-1.5m8.5-3.5v-1.5a1 1 0 0 0-1-1h-1.5m2.5 6v1.5a1 1 0 0 1-1 1h-1.5"
    />
  </svg>
);
export default SiSquareFrame;
