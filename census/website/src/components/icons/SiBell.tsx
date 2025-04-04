import type { SVGProps } from 'react';
const SiBell = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.25 12V10C17.25 7.1005 14.8995 4.75 12 4.75C9.10051 4.75 6.75 7.10051 6.75 10V12L4.75 16.25H19.25L17.25 12Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 16.75C9 16.75 9 19.25 12 19.25C15 19.25 15 16.75 15 16.75"
    />
  </svg>
);
export default SiBell;
