import type { SVGProps } from 'react';
const SiShoppingCart = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.75 7.75H19.25L17.6128 14.7081C17.4002 15.6115 16.5941 16.25 15.666 16.25H11.5395C10.632 16.25 9.83827 15.639 9.60606 14.7618L7.75 7.75ZM7.75 7.75L7 4.75H4.75"
    />
    <circle cx={10} cy={19} r={1} fill="currentColor" />
    <circle cx={17} cy={19} r={1} fill="currentColor" />
  </svg>
);
export default SiShoppingCart;
