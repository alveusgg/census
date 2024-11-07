import type { SVGProps } from 'react';
const SiCirclePlus = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.25 4.75H12A7.25 7.25 0 1 0 19.25 12v-.25m-2.25-7V7m0 0v2.25M17 7h2.25M17 7h-2.25"
    />
  </svg>
);
export default SiCirclePlus;
