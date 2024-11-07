import type { SVGProps } from 'react';
const SiDocumentShield = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m17.25 9.25-4.5-4.5m4.5 4.5h-3.5a1 1 0 0 1-1-1v-3.5m4.5 4.5v1m-4.5-5.5h-6a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h3.5m3.5-4.4 2.75-1.1 2.75 1.1s0 4.4-2.75 4.4-2.75-4.4-2.75-4.4Z"
    />
  </svg>
);
export default SiDocumentShield;
