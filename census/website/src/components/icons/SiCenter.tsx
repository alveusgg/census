import type { SVGProps } from 'react';
const SiCenter = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16.75 4.75h.5a2 2 0 0 1 2 2v.5m-2.5 12h.5a2 2 0 0 0 2-2v-.5m-12-12h-.5a2 2 0 0 0-2 2v.5m2.5 12h-.5a2 2 0 0 1-2-2v-.5m7.25-12V12m0-7.25h-1.25m1.25 0h1.25M12 12v7.25M12 12h7.25M12 12H4.75M12 19.25h-1.25m1.25 0h1.25m6-7.25v-1.25m0 1.25v1.25M4.75 12v-1.25m0 1.25v1.25"
    />
  </svg>
);
export default SiCenter;
