import type { SVGProps } from 'react';
const SiScrubber = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4.75 12H11.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.75 12H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M16.25 12C16.25 13.2426 15.2426 14.25 14 14.25C12.7574 14.25 11.75 13.2426 11.75 12C11.75 10.7574 12.7574 9.75 14 9.75C15.2426 9.75 16.25 10.7574 16.25 12Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiScrubber;
