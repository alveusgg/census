import type { SVGProps } from 'react';
const SiTimerCheckmark = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.25 8.75V12l-1.5 1.25m8.5 1.5s-1.929 2.09-2.893 4.5l-1.607-1.929m-3.5 1.929-.25-.068A7.251 7.251 0 0 1 12 4.75 7.251 7.251 0 0 1 19.182 11l.033.254"
    />
  </svg>
);
export default SiTimerCheckmark;
