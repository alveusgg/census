import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { getLevelArtworkLabel, getLevelByNumber, loadLevelArtwork } from '@/lib/levels';
import { FC, useEffect, useState } from 'react';

const LevelUpArrow: FC = () => (
  <svg width="14" height="23" viewBox="0 0 14 23" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g opacity="0.7">
      <path
        d="M2.66704 10.7374C2.4474 10.2613 1.57469 6.67239 1.03252 3.95637C0.948332 3.53464 0.986027 3.10769 1.65778 2.75409C5.49673 1.77731 6.8046 1.57843 7.64147 1.41207C8.0628 1.30587 8.47732 1.15546 8.99401 1.00049"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.1402 22.0005C10.4148 21.9 11.3669 21.3124 12.0072 20.2118C13.5446 17.5694 12.8969 15.6061 12.6684 14.2348C12.252 11.7355 9.94341 9.75199 7.99769 7.85009C7.13963 7.01135 5.93466 6.08313 3.94676 4.86672C3.51533 4.63009 3.27793 4.52621 3.06091 4.42873C2.8439 4.33125 2.65445 4.24332 2 4.00049"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export const LevelUpModal: FC<ModalProps<{ level: number }>> = props => {
  const level = props.props?.level !== undefined ? getLevelByNumber(props.props.level) : undefined;
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!level) {
      setImageSrc(null);
      return;
    }

    loadLevelArtwork(level).then(src => {
      if (!cancelled) setImageSrc(src);
    });

    return () => {
      cancelled = true;
    };
  }, [level]);

  const levelLabel = level ? getLevelArtworkLabel(level) : null;

  return (
    <Modal {...props} className="overflow-visible border-none bg-transparent p-0 shadow-none">
      <div className="relative mx-auto pt-28">
        <div className="relative rounded-[2.75rem] bg-[#A760F4] px-16 pb-10 pt-[14rem] text-center text-white shadow-[0_18px_48px_rgba(76,29,149,0.35)]">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={levelLabel ? `${levelLabel} artwork` : 'Level artwork'}
              className="pointer-events-none absolute left-1/2 -top-20 rotate-6 -translate-x-1/2 z-10 h-[18rem] drop-shadow-[0_16px_30px_rgba(255,255,255,0.3)]"
            />
          )}
          <div className="relative">
            <p className="text-lg font-semibold italic text-white/75 sm:text-2xl relative w-fit mx-auto">
              now available on your profile
              <div className="absolute -right-8 -top-2">
                <LevelUpArrow />
              </div>
            </p>
            <h1 className="mt-4 text-6xl font-bold leading-none sm:text-7xl">level up!</h1>
            {level && (
              <p className="mt-3 text-2xl font-bold sm:text-3xl">
                lvl {level.number} • {levelLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
