import type { SVGProps } from 'react';
const SiHighlighter = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M11.25 17.25L19.25 7.75L16.25 4.75L6.75 12.75M11.25 17.25L4.75 19.25M11.25 17.25L6.75 12.75M4.75 19.25L6.75 12.75M4.75 19.25H19.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiHighlighter;
