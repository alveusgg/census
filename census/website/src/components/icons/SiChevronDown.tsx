import type { SVGProps } from 'react';
const SiChevronDown = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.25 10.75L12 14.25L8.75 10.75"
    />
  </svg>
);
export default SiChevronDown;
