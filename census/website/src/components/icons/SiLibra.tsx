import type { SVGProps } from 'react';
const SiLibra = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9.25 13.25C8.35786 12.4709 7.75 11.2775 7.75 10C7.75 7.6528 9.65279 5.75002 12 5.75002C14.3472 5.75002 16.25 7.6528 16.25 10C16.25 11.2775 15.6421 12.4709 14.75 13.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.75 13.25H9.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.75 18.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.75 13.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiLibra;
