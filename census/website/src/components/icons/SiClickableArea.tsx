import type { SVGProps } from 'react';
const SiClickableArea = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19.25 11.25V7.75C19.25 6.09315 17.9069 4.75 16.25 4.75H7.75C6.09315 4.75 4.75 6.09315 4.75 7.75V16.25C4.75 17.9069 6.09315 19.25 7.75 19.25H9.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.875 19.25L11.75 10.75L19.25 15.0278L15.5 16.0278L13.875 19.25Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiClickableArea;
