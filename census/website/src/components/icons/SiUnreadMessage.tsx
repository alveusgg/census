import type { SVGProps } from 'react';
const SiUnreadMessage = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.247 11.75c-.12 4.48-3.451 6.5-7.247 6.5-.43 0-.855-.026-1.27-.079a1.149 1.149 0 0 0-.635.103c-.947.448-2.084.752-3.1.956-.915.183-1.541-1.006-1.087-1.822.108-.195.214-.4.315-.615.166-.354.07-.764-.168-1.072-.817-1.055-1.305-2.454-1.305-4.221 0-4.655 3.384-6.75 7.25-6.75h.25M17 9.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z"
    />
  </svg>
);
export default SiUnreadMessage;
