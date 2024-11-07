import type { SVGProps } from 'react';
const SiWrapText = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 6.75h14.5m-14.5 10.5h2.5M4.75 12h11.875a2.625 2.625 0 0 1 0 5.25H10.75m0 0 2-1.5m-2 1.5 2 1.5"
    />
  </svg>
);
export default SiWrapText;
