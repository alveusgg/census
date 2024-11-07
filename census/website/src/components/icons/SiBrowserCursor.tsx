import type { SVGProps } from 'react';
const SiBrowserCursor = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12.25 19.25h-5.5a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v5.5M8 8h.01m3 0h.01m3 0h.01m.72 5.75 1 5.5L17 17l2.25-.75-4.5-2.5Z"
    />
  </svg>
);
export default SiBrowserCursor;
