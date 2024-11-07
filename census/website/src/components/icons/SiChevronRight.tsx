import type { SVGProps } from 'react';
const SiChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.75 8.75L14.25 12L10.75 15.25"
    />
  </svg>
);
export default SiChevronRight;
