import type { SVGProps } from 'react';
const SiArcheryArrow = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.75 4.75h3.5m0 0v3.5m0-3.5-10 10m0 0H7L4.75 17 7 19.25 9.25 17v-2.25Z"
    />
  </svg>
);
export default SiArcheryArrow;
