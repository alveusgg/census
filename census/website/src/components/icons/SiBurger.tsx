import type { SVGProps } from 'react';
const SiBurger = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_701:87)">
      <path
        d="M5.75 7.75C5.75 6.09315 7.09315 4.75 8.75 4.75H15.25C16.9069 4.75 18.25 6.09315 18.25 7.75V9.75H5.75V7.75Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.75 16.25C5.75 17.9069 7.09315 19.25 8.75 19.25H15.25C16.9069 19.25 18.25 17.9069 18.25 16.25V14.75H16L14 15.75L12 14.75H5.75V16.25Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.75 12.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_701:87">
        <rect width={24} height={24} fill="white" />
      </clipPath>
    </defs>
  </svg>
);
export default SiBurger;
