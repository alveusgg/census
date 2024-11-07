import type { SVGProps } from 'react';
const SiGolf = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 14.75C7 14.75 5.41667 17.9167 4.75 19.25H19.25C18.5833 17.9167 17 14.75 12 14.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.75 16.25V9.25M11.75 9.25V4.75L17.25 7L11.75 9.25Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiGolf;
