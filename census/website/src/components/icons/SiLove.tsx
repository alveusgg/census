import type { SVGProps } from 'react';
const SiLove = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.75 19.25s1.575-2.5 5.25-2.5 5.25 2.5 5.25 2.5m-3-7.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16.498 5.403c-.55-.715-1.467-.907-2.156-.253-.688.654-.785 1.748-.244 2.521l2.4 2.579 2.4-2.579c.542-.773.456-1.874-.244-2.52-.701-.648-1.606-.463-2.156.252Z"
      clipRule="evenodd"
    />
  </svg>
);
export default SiLove;
