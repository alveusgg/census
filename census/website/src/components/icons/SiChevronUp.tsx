import type { SVGProps } from 'react';
const SiChevronUp = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.25 14.25L12 10.75L8.75 14.25"
    />
  </svg>
);
export default SiChevronUp;
