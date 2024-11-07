import type { SVGProps } from 'react';
const SiEaseOutControl = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.25 5.75s-9.25 0-14.5 13.5M9.75 6h.5m2.5 0h.5m2.5 0h.5M4.75 6a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Z"
    />
  </svg>
);
export default SiEaseOutControl;
