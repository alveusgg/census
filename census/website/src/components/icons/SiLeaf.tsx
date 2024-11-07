import type { SVGProps } from 'react';
const SiLeaf = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.75 13C4.75 7.4 19.25 4.75 19.25 4.75C19.25 4.75 18.25 19.25 12 19.25C8 19.25 4.75 17 4.75 13Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.75 19.25C4.75 19.25 8 14 12.25 11.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiLeaf;
