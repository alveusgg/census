import * as Slider from '@radix-ui/react-slider';

export const Playhead = () => {
  return (
    <Slider.Thumb className="block w-[3px] h-[46px] bg-white outline-none pointer-events-none z-30">
      <svg className="absolute -top-1 left-1/2 -translate-x-1/2" width="18" viewBox="0 0 14 11" fill="none">
        <path
          d="M7.86602 10.5C7.48112 11.1667 6.51887 11.1667 6.13397 10.5L0.93782 1.5C0.55292 0.833332 1.03405 -2.67268e-07 1.80385 -1.9997e-07L12.1962 7.08554e-07C12.966 7.75852e-07 13.4471 0.833334 13.0622 1.5L7.86602 10.5Z"
          fill="white"
        />
      </svg>
    </Slider.Thumb>
  );
};
