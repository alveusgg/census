import type { SVGProps } from 'react';
const SiMusicNote = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.25 16.5a2.75 2.75 0 1 0-5.5 0 2.75 2.75 0 0 0 5.5 0Zm0 0V4.75c7 0 7 6.5 7 6.5"
    />
  </svg>
);
export default SiMusicNote;
