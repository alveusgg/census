import type { SVGProps } from 'react';
const SiFileCheckmark = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.75 4.75h-5a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h3.5m1.5-14.5v3.5a2 2 0 0 0 2 2h3.5m-5.5-5.5 5.5 5.5m0 0v1m1 3.5s-1.929 2.09-2.893 4.5l-1.607-1.929"
    />
  </svg>
);
export default SiFileCheckmark;
