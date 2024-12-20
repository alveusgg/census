import type { SVGProps } from 'react';
const SiSpeakerMute = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19.25 14.25L15.75 10.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.75 14.25L19.25 10.75"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.25 4.75L8.5 8.75H5.75C5.19772 8.75 4.75 9.19772 4.75 9.75V14.25C4.75 14.8023 5.19772 15.25 5.75 15.25H8.5L13.25 19.25V4.75Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiSpeakerMute;
