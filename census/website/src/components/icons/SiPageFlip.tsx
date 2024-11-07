import type { SVGProps } from 'react';
const SiPageFlip = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 19.25C8 19.25 4.75 17.25 4.75 17.25V5.75C4.75 5.75 8.5 6.75 12 6.75V19.25ZM12 19.25C16 19.25 19.25 17.25 19.25 17.25V5.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 6.75C14.5 6.75 16.25 4.75 16.25 4.75V17C16.25 17 14.5 19 12 19"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiPageFlip;
