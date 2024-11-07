import type { SVGProps } from 'react';
const SiLego = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 18.25v-3.5a1 1 0 0 1 1-1h1v-2h3.5v2h3.5v-2h3.5v2h1a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H5.75a1 1 0 0 1-1-1Z"
    />
  </svg>
);
export default SiLego;
