import type { SVGProps } from 'react';
const SiStickyNote = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.75 19.25h-7a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v7m-5.5 5.5 5.5-5.5m-5.5 5.5v-4.5a1 1 0 0 1 1-1h4.5"
    />
  </svg>
);
export default SiStickyNote;
