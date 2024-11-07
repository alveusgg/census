import type { SVGProps } from 'react';
const SiPoll = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.75 7h6.5m-6.5 10h6.5M7 9.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Zm0 10a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z"
    />
  </svg>
);
export default SiPoll;
