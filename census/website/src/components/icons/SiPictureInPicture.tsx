import type { SVGProps } from 'react';
const SiPictureInPicture = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.25 17.25H6.75C5.64543 17.25 4.75 16.3546 4.75 15.25V6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V9.25"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.75 13.75C10.75 13.1977 11.1977 12.75 11.75 12.75H18.25C18.8023 12.75 19.25 13.1977 19.25 13.75V18.25C19.25 18.8023 18.8023 19.25 18.25 19.25H11.75C11.1977 19.25 10.75 18.8023 10.75 18.25V13.75Z"
    />
  </svg>
);
export default SiPictureInPicture;
