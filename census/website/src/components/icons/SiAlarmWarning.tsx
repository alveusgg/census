import type { SVGProps } from 'react';
const SiAlarmWarning = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5.25 4.75L4.75 5.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M12 8.75V12L14.25 14.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.1295 13.3166C18.4024 17.2541 14.621 19.8566 10.6835 19.1295C6.746 18.4024 4.14348 14.621 4.8706 10.6835C5.59772 6.746 9.37914 4.14348 13.3166 4.8706"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 18L5.75 19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 18L18.25 19.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 4.75V7.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M18.5 10C18.5 10.2761 18.2761 10.5 18 10.5C17.7239 10.5 17.5 10.2761 17.5 10C17.5 9.72386 17.7239 9.5 18 9.5C18.2761 9.5 18.5 9.72386 18.5 10Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SiAlarmWarning;
