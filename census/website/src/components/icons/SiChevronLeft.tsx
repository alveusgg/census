import type { SVGProps } from 'react';
const SiChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.25 8.75L9.75 12L13.25 15.25"
    />
  </svg>
);
export default SiChevronLeft;
