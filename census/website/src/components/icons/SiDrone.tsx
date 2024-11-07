import type { SVGProps } from 'react';
const SiDrone = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.25 13.25H6.5a1.75 1.75 0 1 1 0-3.5H8s2 1.5 4 1.5 4-1.5 4-1.5h1.5a1.75 1.75 0 1 1 0 3.5h-.75m-9.5 0H9c1.6 0 .5 3 3 3s1.4-3 3-3h1.75m-9.5 0s0 3-2.5 3m12-3s0 3 2.5 3m-14.5-9.5h4.5m5.5 0h4.5"
    />
  </svg>
);
export default SiDrone;
