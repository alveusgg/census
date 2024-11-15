import type { SVGProps } from 'react';
const SiTextCapitalise = (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4.75 17.25L8 6.75L11.25 17.25"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6 14.25H10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M19.25 14.5C19.25 16.0188 18.0188 17.25 16.5 17.25C14.9812 17.25 13.75 16.0188 13.75 14.5C13.75 12.9812 14.9812 11.75 16.5 11.75C18.0188 11.75 19.25 12.9812 19.25 14.5Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19.25 11.75V17.25" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default SiTextCapitalise;
