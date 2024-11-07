import type { SVGProps } from 'react';
const SiLockBorder = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.75 4.75h1.5a2 2 0 0 1 2 2v1.5m-3.5 11h1.5a2 2 0 0 0 2-2v-1.5m-11-11h-1.5a2 2 0 0 0-2 2v1.5m3.5 11h-1.5a2 2 0 0 1-2-2v-1.5m5-5.25v-.75a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2v.75m-5.5.25h6.5v3.5a2 2 0 0 1-2 2h-2.5a2 2 0 0 1-2-2v-3.5Z"
    />
  </svg>
);
export default SiLockBorder;
