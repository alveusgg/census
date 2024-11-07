import type { SVGProps } from 'react';
const SiSignage = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 9.75H6.75a2 2 0 0 0-2 2v5.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2H16m-8 0 4-5 4 5m-8 0h8"
    />
  </svg>
);
export default SiSignage;
