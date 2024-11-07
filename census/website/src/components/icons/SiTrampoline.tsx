import type { SVGProps } from 'react';
const SiTrampoline = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19.25 10C19.25 12.3472 16.0041 14.25 12 14.25C7.99594 14.25 4.75 12.3472 4.75 10C4.75 7.65279 7.99594 5.75 12 5.75C16.0041 5.75 19.25 7.65279 19.25 10Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 14.5V18.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.75 10V15.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.25 10V15.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiTrampoline;
