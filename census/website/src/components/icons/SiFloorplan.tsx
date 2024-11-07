import type { SVGProps } from 'react';
const SiFloorplan = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.25 19v-6.25a1 1 0 0 0-1-1h-2m0 0H5m3.25 0V5m7 0v9a1 1 0 0 1-1 1H11.5m-4.75 4.25h10.5a2 2 0 0 0 2-2V6.75a2 2 0 0 0-2-2H6.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2Z"
    />
  </svg>
);
export default SiFloorplan;
