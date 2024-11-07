import type { SVGProps } from 'react';
const SiBlockOutside = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 11.75v5.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-5.5M12 9.25v-4.5m0 0-2.25 2.5M12 4.75l2.25 2.5m0 8.5h-4.5a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1Z"
    />
  </svg>
);
export default SiBlockOutside;
