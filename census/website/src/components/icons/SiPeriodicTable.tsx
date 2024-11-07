import type { SVGProps } from 'react';
const SiPeriodicTable = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M13.25 12V17L9 19.25L4.75 17V12L9 9.75L13.25 12ZM13.25 12L17 10.25M17 10.25L14.75 9V6L17 4.75L19.25 6V9L17 10.25Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.75 14.25V13.25L9 12.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiPeriodicTable;
