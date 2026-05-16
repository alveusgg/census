import type { CSSProperties, ReactNode } from 'react';

export type StickerSilhouette = {
  readonly height: number;
  readonly path: string;
  readonly viewBox: string;
  readonly width: number;
};

export type StickerArtwork = {
  readonly imageAlt?: string;
  readonly imageSrc: string;
  readonly silhouette: StickerSilhouette;
};

export type StickerPoint = {
  readonly x: number;
  readonly y: number;
};

export type StickerInitialValue = {
  readonly height: number;
  readonly rotation?: number;
  readonly width: number;
  readonly x?: number;
  readonly y?: number;
  readonly zIndex?: number;
};

export type StickerValue = {
  readonly height: number;
  readonly rotation: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
  readonly zIndex: number;
};

export type StickerGeometry = {
  readonly contentOffset?: StickerPoint;
  readonly peelPaddingRatio?: number;
  readonly rotation?: string;
};

export type StickerBoardPeel = {
  readonly drag?: number;
  readonly hover?: number;
};

export type StickerBoardMode = 'interactive' | 'static';

export type StickerBoardReferenceSize = {
  readonly height: number;
  readonly width: number;
};

export type StickerSpec = {
  readonly id: string;
  readonly label: string;
  readonly tooltip?: ReactNode;
  readonly className?: string;
  readonly initialValue: StickerInitialValue;
  readonly geometry: StickerGeometry;
  readonly artwork: StickerArtwork;
};

export type StickerPosition = {
  readonly height: number;
  readonly rotation: number;
  readonly x: number;
  readonly y: number;
  readonly zIndex: number;
  readonly width: number;
};

export type StickerValueMap = Record<string, StickerValue>;

export type StickerPositionMap = Record<string, StickerPosition>;

export type StickerBoardProps = {
  readonly stickers: readonly StickerSpec[];
  readonly mode?: StickerBoardMode;
  readonly effects?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly boardLabel?: string;
  readonly referenceSize?: StickerBoardReferenceSize;
  readonly peel?: StickerBoardPeel;
  readonly onDragEnd?: (value: StickerValueMap, stickerId: string) => void;
  readonly onChange?: (value: StickerValueMap) => void;
  readonly value: StickerValueMap;
};

export type StickerHandle = {
  readonly id: string;
  readonly root: HTMLDivElement;
  readonly updateLightPosition: (clientX: number, clientY: number) => boolean;
};

export type StickerDragState = {
  readonly pointerId: number;
  readonly stickerId: string;
  readonly offsetX: number;
  readonly offsetY: number;
};

export type StickerRuntimeCss = CSSProperties & {
  readonly '--flap-width': string;
  readonly '--sticker-end': string;
  readonly '--sticker-flipped-light-filter': string;
  readonly '--sticker-light-filter': string;
  readonly '--sticker-p': string;
  readonly '--sticker-peel-easing': string;
  readonly '--sticker-peel-hover-easing': string;
  readonly '--sticker-peelback-active': string;
  readonly '--sticker-peelback-hover': string;
  readonly '--sticker-rotate': string;
  readonly '--sticker-shadow-filter': string;
  readonly '--sticker-start': string;
};
