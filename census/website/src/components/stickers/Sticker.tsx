import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  type CSSProperties,
  type JSX,
  type PointerEvent as ReactPointerEvent
} from 'react';

import type { StickerBoardPeel, StickerHandle, StickerPosition, StickerRuntimeCss, StickerSpec } from './types';

const DEFAULT_CONTENT_OFFSET = { x: 0, y: 0 };
const DEFAULT_PEEL_ACTIVE_RATIO = 0.44;
const DEFAULT_PEEL_HOVER_RATIO = 0.22;
const DEFAULT_PEEL_PADDING_RATIO = 0.07;

// Custom timing functions that drive the two peel transitions. Kept inside the
// library so consumers do not need to provide globally defined CSS custom
// properties just to get the correct animation feel.
const PEEL_EASING =
  '2s linear(0, 0.002 0.4%, 0.008 0.9%, 0.02 1.4%, 0.035 1.9%, 0.055 2.4%, 0.083 3%, 0.11 3.5%, 0.146 4.1%, 0.214 5.1%, 0.297 6.2%, 0.624 10.2%, 0.756 11.9%, 0.821 12.8%, 0.874 13.6%, 0.93 14.5%, 0.975 15.3%, 1.016 16.1%, 1.053 16.9%, 1.085 17.7%, 1.116 18.6%, 1.139 19.4%, 1.16 20.3%, 1.176 21.2%, 1.187 22.1%, 1.195 23.2%, 1.197 24.4%, 1.193 25.6%, 1.183 26.9%, 1.17 28.1%, 1.153 29.4%, 1.055 35.6%, 1.031 37.3%, 1.012 38.8%, 0.994 40.6%, 0.98 42.3%, 0.97 44.1%, 0.964 45.9%, 0.961 48.3%, 0.964 51.1%, 0.97 53.7%, 0.997 62.7%, 1.003 66%, 1.007 69.3%, 1.007 74.4%, 1 89.2%, 1)';

const PEEL_HOVER_EASING =
  '1s linear(0, 0.008 1.1%, 0.031 2.2%, 0.129 4.8%, 0.257 7.2%, 0.671 14.2%, 0.789 16.5%, 0.881 18.6%, 0.957 20.7%, 1.019 22.9%, 1.063 25.1%, 1.094 27.4%, 1.114 30.7%, 1.112 34.5%, 1.018 49.9%, 0.99 59.1%, 1)';

// Tailwind arbitrary values encode spaces as underscores. These long clip-path
// polygons are hoisted to module scope so the JSX below stays readable.
const CLIP_PATH_FULL =
  '[clip-path:polygon(var(--sticker-start)_var(--sticker-start),var(--sticker-end)_var(--sticker-start),var(--sticker-end)_var(--sticker-end),var(--sticker-start)_var(--sticker-end))]';

const CLIP_PATH_HOVER_MAIN =
  'group-hover:[clip-path:polygon(var(--sticker-start)_var(--sticker-peelback-hover),var(--sticker-end)_var(--sticker-peelback-hover),var(--sticker-end)_var(--sticker-end),var(--sticker-start)_var(--sticker-end))]';

const CLIP_PATH_ACTIVE_MAIN =
  'group-active:[clip-path:polygon(var(--sticker-start)_var(--sticker-peelback-active),var(--sticker-end)_var(--sticker-peelback-active),var(--sticker-end)_var(--sticker-end),var(--sticker-start)_var(--sticker-end))]';

const CLIP_PATH_FLAP_COLLAPSED =
  '[clip-path:polygon(var(--sticker-start)_var(--sticker-start),var(--sticker-end)_var(--sticker-start),var(--sticker-end)_var(--sticker-start),var(--sticker-start)_var(--sticker-start))]';

const CLIP_PATH_HOVER_FLAP =
  'group-hover:[clip-path:polygon(var(--sticker-start)_var(--sticker-start),var(--sticker-end)_var(--sticker-start),var(--sticker-end)_var(--sticker-peelback-hover),var(--sticker-start)_var(--sticker-peelback-hover))]';

const CLIP_PATH_ACTIVE_FLAP =
  'group-active:[clip-path:polygon(var(--sticker-start)_var(--sticker-start),var(--sticker-end)_var(--sticker-start),var(--sticker-end)_var(--sticker-peelback-active),var(--sticker-start)_var(--sticker-peelback-active))]';

const TRANSITION_MAIN_BASE = '[transition:clip-path_var(--sticker-peel-hover-easing)]';
const TRANSITION_MAIN_ACTIVE = 'group-active:[transition:clip-path_var(--sticker-peel-easing)]';
const TRANSITION_FLAP_BASE = '[transition:all_var(--sticker-peel-hover-easing)]';
const TRANSITION_FLAP_ACTIVE = 'group-active:[transition:all_var(--sticker-peel-easing)]';

const FLAP_BASE_POSITION = '[top:calc(-100%_-_var(--sticker-p)_-_var(--sticker-p))]';
const FLAP_HOVER_POSITION = 'group-hover:[top:calc(-100%_+_2_*_var(--sticker-peelback-hover)_-_1px)]';
const FLAP_ACTIVE_POSITION = 'group-active:[top:calc(-100%_+_2_*_var(--sticker-peelback-active)_-_1px)]';

const joinClasses = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');

type PeelStickerProps<Id extends string> = {
  readonly sticker: StickerSpec<Id>;
  readonly position: StickerPosition;
  readonly interactive: boolean;
  readonly effectsEnabled: boolean;
  readonly peel?: StickerBoardPeel;
  readonly onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, stickerId: Id) => void;
  readonly registerHandle: (stickerId: Id, handle: StickerHandle<Id> | null) => void;
};

const StickerComponent = <Id extends string>({
  sticker,
  position,
  interactive,
  effectsEnabled,
  peel,
  onPointerDown,
  registerHandle
}: PeelStickerProps<Id>): JSX.Element => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lightRef = useRef<SVGFEPointLightElement | null>(null);
  const flippedLightRef = useRef<SVGFEPointLightElement | null>(null);
  const uniqueId = useId().replaceAll(':', '');

  const filterIds = useMemo(
    () => ({
      expand: `sticker-expand-${uniqueId}`,
      flippedLight: `sticker-flipped-filter-${uniqueId}`,
      light: `sticker-light-filter-${uniqueId}`
    }),
    [uniqueId]
  );

  const derivedGeometry = useMemo(() => {
    const width = position.width;
    const height = position.height;
    const peelPadding = width * (sticker.geometry.peelPaddingRatio ?? DEFAULT_PEEL_PADDING_RATIO);

    return {
      contentOffset: sticker.geometry.contentOffset ?? DEFAULT_CONTENT_OFFSET,
      height,
      peelActive: `${(peel?.drag ?? DEFAULT_PEEL_ACTIVE_RATIO) * 100}%`,
      peelHover: `${(peel?.hover ?? DEFAULT_PEEL_HOVER_RATIO) * 100}%`,
      peelPadding,
      rotation: `${position.rotation}deg`,
      width
    };
  }, [peel?.drag, peel?.hover, position.height, position.rotation, position.width, sticker.geometry]);

  const updateLightPosition = useCallback((clientX: number, clientY: number): boolean => {
    const root = rootRef.current;
    if (!root) {
      return false;
    }

    const rect = root.getBoundingClientRect();
    const isInside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!isInside) {
      return false;
    }

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    lightRef.current?.setAttribute('x', String(localX));
    lightRef.current?.setAttribute('y', String(localY));
    flippedLightRef.current?.setAttribute('x', String(localX));
    flippedLightRef.current?.setAttribute('y', String(rect.height - localY));

    return true;
  }, []);

  const setRootRef = useCallback(
    (root: HTMLDivElement | null): void => {
      rootRef.current = root;
      registerHandle(sticker.id, root ? { id: sticker.id, root, updateLightPosition } : null);
    },
    [registerHandle, sticker.id, updateLightPosition]
  );

  const runtimeStyle: StickerRuntimeCss = {
    left: position.x,
    top: position.y,
    zIndex: position.zIndex,
    '--flap-width': `${derivedGeometry.width}px`,
    '--sticker-end': `calc(100% + ${derivedGeometry.peelPadding}px)`,
    '--sticker-flipped-light-filter': effectsEnabled ? `url(#${filterIds.flippedLight})` : 'none',
    '--sticker-light-filter': effectsEnabled ? `url(#${filterIds.light})` : 'none',
    '--sticker-p': `${derivedGeometry.peelPadding}px`,
    '--sticker-peel-easing': PEEL_EASING,
    '--sticker-peel-hover-easing': PEEL_HOVER_EASING,
    '--sticker-peelback-active': derivedGeometry.peelActive,
    '--sticker-peelback-hover': derivedGeometry.peelHover,
    '--sticker-rotate': derivedGeometry.rotation,
    '--sticker-shadow-filter': `url(#${filterIds.expand})`,
    '--sticker-start': `calc(-1 * ${derivedGeometry.peelPadding}px)`,
    height: derivedGeometry.height,
    width: derivedGeometry.width
  };

  const artworkIds = useMemo(
    () => ({
      clipPath: `sticker-clip-${uniqueId}`
    }),
    [uniqueId]
  );

  // Peel animations are driven purely by React state. When the board is not
  // interactive, or when effects are disabled, we simply do not emit the
  // group-hover / group-active Tailwind variants, which leaves the sticker in
  // its base (collapsed) visual state instead of relying on a parent modifier
  // class to override pseudo-class styles.
  const peelEffectsEnabled = interactive && effectsEnabled;
  const flapLightingEnabled = interactive && effectsEnabled;

  const rootClassName = joinClasses(
    'group absolute touch-none select-none',
    interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
    sticker.className
  );

  const containerStyle: CSSProperties = {
    left: derivedGeometry.contentOffset.x,
    top: derivedGeometry.contentOffset.y,
    transform: 'rotate(var(--sticker-rotate))',
    transformOrigin: 'center center'
  };

  const stickerMainClassName = joinClasses(
    CLIP_PATH_FULL,
    TRANSITION_MAIN_BASE,
    peelEffectsEnabled && CLIP_PATH_HOVER_MAIN,
    peelEffectsEnabled && CLIP_PATH_ACTIVE_MAIN,
    peelEffectsEnabled && TRANSITION_MAIN_ACTIVE
  );

  const flapClassName = joinClasses(
    // Intentionally no `top-0` utility here: Tailwind emits `top-0` after our
    // arbitrary `[top:calc(...)]` utility, which would win and leave the flap
    // stuck at the sticker's top edge instead of its collapsed position above
    // the sticker. The arbitrary FLAP_BASE_POSITION sets `top` for us.
    'absolute left-0 h-full w-full -scale-y-100',
    CLIP_PATH_FLAP_COLLAPSED,
    FLAP_BASE_POSITION,
    TRANSITION_FLAP_BASE,
    peelEffectsEnabled && CLIP_PATH_HOVER_FLAP,
    peelEffectsEnabled && CLIP_PATH_ACTIVE_FLAP,
    peelEffectsEnabled && FLAP_HOVER_POSITION,
    peelEffectsEnabled && FLAP_ACTIVE_POSITION,
    peelEffectsEnabled && TRANSITION_FLAP_ACTIVE
  );

  const shadowClassName = joinClasses(
    'absolute top-0 left-2 h-full w-full',
    effectsEnabled ? 'opacity-20 [filter:brightness(0)_blur(4px)]' : 'opacity-[0.12]'
  );

  const stickerLightingClassName = effectsEnabled ? 'group-hover:[filter:var(--sticker-light-filter)]' : undefined;

  const flapLightingClassName = flapLightingEnabled
    ? 'group-hover:[filter:var(--sticker-flipped-light-filter)]'
    : undefined;

  const renderGraphic = (withShadowFilter: boolean): JSX.Element => {
    const { imageAlt, imageSrc, silhouette } = sticker.artwork;
    const svgStyle: CSSProperties = {
      width: 'var(--flap-width)',
      filter: withShadowFilter ? 'var(--sticker-shadow-filter)' : undefined,
      pointerEvents: 'none',
      userSelect: 'none'
    };

    return (
      <svg
        viewBox={silhouette.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={imageAlt ?? sticker.label}
        style={svgStyle}
      >
        <defs>
          <clipPath id={artworkIds.clipPath}>
            <path d={silhouette.path} />
          </clipPath>
        </defs>
        <image
          href={imageSrc}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${artworkIds.clipPath})`}
        />
      </svg>
    );
  };

  return (
    <div
      ref={setRootRef}
      className={rootClassName}
      aria-label={sticker.label}
      onPointerDown={event => onPointerDown(event, sticker.id)}
      onPointerMove={event => {
        if (effectsEnabled) {
          updateLightPosition(event.clientX, event.clientY);
        }
      }}
      style={runtimeStyle}
    >
      <svg className="absolute pointer-events-none" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id={filterIds.light}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant="0.1"
              lightingColor="white"
            >
              <fePointLight ref={lightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feBlend in="spec" in2="SourceGraphic" operator="screen" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={filterIds.flippedLight}>
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant="0.7"
              lightingColor="white"
            >
              <fePointLight ref={flippedLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feBlend in="spec" in2="SourceGraphic" operator="screen" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={filterIds.expand}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179, 179, 179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none relative transition-transform duration-180 ease-out" style={containerStyle}>
        <div className={stickerMainClassName}>
          <div className={stickerLightingClassName}>{renderGraphic(false)}</div>
        </div>
        <div className={shadowClassName}>
          <div className={flapClassName}>{renderGraphic(true)}</div>
        </div>
        <div className={flapClassName}>
          <div className={flapLightingClassName}>{renderGraphic(true)}</div>
        </div>
      </div>
    </div>
  );
};

export const Sticker = memo(StickerComponent) as typeof StickerComponent;
