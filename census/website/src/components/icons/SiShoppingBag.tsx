import type { SVGProps } from 'react';
const SiShoppingBag = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.25 7.75H5.75V16.75L4.75 19.25H19.25L18.25 16.75V7.75Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.25 7.75L16.25 4.75H7.75L5.75 7.75"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 10.75V11.75C9.75 12.9926 10.7574 14 12 14V14C13.2426 14 14.25 12.9926 14.25 11.75V10.75"
    />
  </svg>
);
export default SiShoppingBag;
