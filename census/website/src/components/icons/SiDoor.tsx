import type { SVGProps } from 'react';
const SiDoor = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M15.25 4.75H8.75C7.64543 4.75 6.75 5.64543 6.75 6.75V19.25H17.25V6.75C17.25 5.64543 16.3546 4.75 15.25 4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 12C14.5 12.2761 14.2761 12.5 14 12.5C13.7239 12.5 13.5 12.2761 13.5 12C13.5 11.7239 13.7239 11.5 14 11.5C14.2761 11.5 14.5 11.7239 14.5 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.75 19.25H19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiDoor;
