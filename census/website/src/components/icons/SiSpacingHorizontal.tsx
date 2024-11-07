import type { SVGProps } from 'react';
const SiSpacingHorizontal = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.75 4.75H6.25C7.35457 4.75 8.25 5.64543 8.25 6.75V17.25C8.25 18.3546 7.35457 19.25 6.25 19.25H4.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.25 4.75H17.75C16.6454 4.75 15.75 5.64543 15.75 6.75V17.25C15.75 18.3546 16.6454 19.25 17.75 19.25H19.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 8.75V15.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiSpacingHorizontal;
