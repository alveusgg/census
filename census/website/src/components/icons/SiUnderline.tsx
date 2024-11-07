import type { SVGProps } from 'react';
const SiUnderline = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4.75 19.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M16.25 4.75V11C16.25 13.3472 14.3472 15.25 12 15.25C9.65279 15.25 7.75 13.3472 7.75 11V4.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiUnderline;
