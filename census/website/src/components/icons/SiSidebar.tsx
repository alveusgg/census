import type { SVGProps } from 'react';
const SiSidebar = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.75 4.75h4.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2h-4.5m-8-2V6.75a2 2 0 0 1 2-2h2.5v14.5h-2.5a2 2 0 0 1-2-2Z"
    />
  </svg>
);
export default SiSidebar;
