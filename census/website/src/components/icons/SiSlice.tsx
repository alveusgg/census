import type { SVGProps } from 'react';
const SiSlice = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M13.25 10.75L7.75 16.25H13.25V13.75M13.25 10.75L19.25 4.75V8L13.25 13.75M13.25 10.75V13.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.75 19.25H6.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.75 19.25H10.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.75 19.25H14.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.75 19.25H18.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiSlice;
