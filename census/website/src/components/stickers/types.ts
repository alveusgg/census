import type { CSSProperties } from 'react';

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
  readonly x: number;
  readonly y: number;
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

export type StickerSpec<Id extends string = string> = {
  readonly id: Id;
  readonly label: string;
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

export type StickerValueMap<Id extends string = string> = Record<Id, StickerValue>;

export type StickerPositionMap<Id extends string = string> = Record<Id, StickerPosition>;

export type StickerBoardProps<Id extends string = string> = {
  readonly stickers: readonly StickerSpec<Id>[];
  readonly mode?: StickerBoardMode;
  readonly effects?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly boardLabel?: string;
  readonly referenceSize?: StickerBoardReferenceSize;
  readonly peel?: StickerBoardPeel;
  readonly onDragEnd?: (value: StickerValueMap<Id>, stickerId: Id) => void;
  readonly onChange?: (value: StickerValueMap<Id>) => void;
  readonly value: StickerValueMap<Id>;
};

export type StickerHandle<Id extends string = string> = {
  readonly id: Id;
  readonly root: HTMLDivElement;
  readonly updateLightPosition: (clientX: number, clientY: number) => boolean;
};

export type StickerDragState<Id extends string = string> = {
  readonly pointerId: number;
  readonly stickerId: Id;
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
