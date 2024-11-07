import type { SVGProps } from 'react';
const SiQrScan = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 7.25v-2.5h14.5v2.5m-14.5 9.5v2.5h14.5v-2.5M4.75 12h14.5"
    />
  </svg>
);
export default SiQrScan;
