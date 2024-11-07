import type { SVGProps } from 'react';
const SiPawn = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M6.75 19.25L7.44721 17.8556C7.786 17.178 8.47852 16.75 9.23606 16.75H14.7639C15.5215 16.75 16.214 17.178 16.5528 17.8556L17.25 19.25H6.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.25 7C14.25 8.24264 13.2426 9.25 12 9.25C10.7574 9.25 9.75 8.24264 9.75 7C9.75 5.75736 10.7574 4.75 12 4.75C13.2426 4.75 14.25 5.75736 14.25 7Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8.75 16.5L10.75 9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.25 9L15.25 16.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiPawn;
