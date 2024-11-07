import type { SVGProps } from 'react';
const SiBandAid = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19.25 14L10 4.75H8.75C6.54086 4.75 4.75 6.54086 4.75 8.75V10L14 19.25H15.25C17.4591 19.25 19.25 17.4591 19.25 15.25V14Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 10L10 11L13 14L14 13L11 10Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiBandAid;
