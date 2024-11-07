import type { SVGProps } from 'react';
const SiCursor = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5.75 5.75L11 18.25L13 13L18.25 11L5.75 5.75Z"
    />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13L18.25 18.25" />
  </svg>
);
export default SiCursor;
