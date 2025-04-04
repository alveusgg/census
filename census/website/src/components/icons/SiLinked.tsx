import type { SVGProps } from 'react';
const SiLinked = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M11 14.25H12.5C15.1234 14.25 17.25 12.1234 17.25 9.5C17.25 6.87665 15.1234 4.75 12.5 4.75H9C6.65279 4.75 4.75 6.65279 4.75 9V10.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 9.75H11.5C8.87665 9.75 6.75 11.8766 6.75 14.5C6.75 17.1234 8.87665 19.25 11.5 19.25H15C17.3472 19.25 19.25 17.3472 19.25 15V13.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiLinked;
