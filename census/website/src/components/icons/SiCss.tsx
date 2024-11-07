import type { SVGProps } from 'react';
const SiCss = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.25 8.75h-.5a2 2 0 0 0-2 2v2.5a2 2 0 0 0 2 2h.5m5-6.5h-1.5a1 1 0 0 0-1 1v.823a1 1 0 0 0 .629.928L12.62 12a1 1 0 0 1 .629.928v1.323a1 1 0 0 1-1 1h-1.5m7.5-6.5h-1.5a1 1 0 0 0-1 1v.823a1 1 0 0 0 .629.928L17.62 12a1 1 0 0 1 .629.928v1.323a1 1 0 0 1-1 1h-1.5"
    />
  </svg>
);
export default SiCss;
