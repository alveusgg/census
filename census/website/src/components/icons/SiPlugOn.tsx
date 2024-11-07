import type { SVGProps } from 'react';
const SiPlugOn = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M6.75 11.3431V7.75H17.25V11.3431C17.25 12.404 16.8286 13.4214 16.0784 14.1716L14.25 16V18.25C14.25 18.8023 13.8023 19.25 13.25 19.25H10.75C10.1977 19.25 9.75 18.8023 9.75 18.25V16L7.92157 14.1716C7.17143 13.4214 6.75 12.404 6.75 11.3431Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.75 7.5V4.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.25 7.5V4.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiPlugOn;
