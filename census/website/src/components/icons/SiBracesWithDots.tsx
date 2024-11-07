import type { SVGProps } from 'react';
const SiBracesWithDots = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.25 4.75h-.324c-.858 0-1.597.697-1.765 1.665l-.504 2.899c-.07.4-.241.769-.492 1.058L4.75 12l1.415 1.628c.25.29.422.657.492 1.058l.504 2.899c.168.968.907 1.665 1.765 1.665h.324m5.5-14.5h.324c.858 0 1.597.697 1.765 1.665l.504 2.899c.07.4.241.769.492 1.058L19.25 12l-1.415 1.628a2.2 2.2 0 0 0-.492 1.058l-.504 2.899c-.168.968-.907 1.665-1.765 1.665h-.324M9 12h.01M12 12h.01M15 12h.01"
    />
  </svg>
);
export default SiBracesWithDots;
