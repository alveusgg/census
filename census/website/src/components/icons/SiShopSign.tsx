import type { SVGProps } from 'react';
const SiShopSign = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M8.75 4.75H16.25L19.25 19.25H11.75L8.75 4.75ZM8.75 4.75L4.75 19.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6 15.25H10.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiShopSign;
