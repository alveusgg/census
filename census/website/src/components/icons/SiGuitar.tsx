import type { SVGProps } from 'react';
const SiGuitar = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.217 18.512c-1.207 1.206-3.467.902-5.05-.68-1.581-1.582-1.885-3.842-.679-5.049 1.207-1.206 3.026-1.593 3.526-2.093.262-.262.395-.79.463-1.233.065-.423.375-.751.815-.702.831.093 2.21.43 3.367 1.586 1.156 1.157 1.493 2.536 1.586 3.367.05.44-.28.75-.702.815-.443.068-.971.201-1.233.463-.5.5-.887 2.319-2.093 3.526ZM9.75 14.25l9.41-9.5"
    />
  </svg>
);
export default SiGuitar;
