import type { SVGProps } from 'react';
const SiSneaker = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.25 14.25v-.327a3 3 0 0 0-1.747-2.726L12.72 9m6.529 5.25H4.75m14.5 0v2.5H4.75v-2.5m0 0V9c3 1 5.25-1.25 5.25-1.25L12.72 9m0 0-1.97 2.25"
    />
  </svg>
);
export default SiSneaker;
