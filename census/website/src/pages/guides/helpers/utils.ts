import { RoomSnapshot } from '@tldraw/sync';
import {
  DefaultColorThemePalette,
  DefaultSizeStyle,
  Editor,
  TLCameraOptions,
  TLDefaultFont,
  TLFontFace,
  TLStoreSnapshot
} from 'tldraw';

DefaultSizeStyle.setDefaultValue('s');
DefaultColorThemePalette.lightMode.black.solid = 'rgb(75 39 12)';

export const WIDTH = 700;
export const CAMERA_OPTIONS: TLCameraOptions = {
  isLocked: false,
  wheelBehavior: 'pan',
  panSpeed: 1,
  zoomSpeed: 0,
  zoomSteps: [1],
  constraints: {
    initialZoom: 'fit-x-100',
    baseZoom: 'fit-x-100',
    bounds: {
      x: 0,
      y: 0,
      w: WIDTH,
      h: Infinity
    },
    behavior: { x: 'fixed', y: 'contain' },
    padding: { x: 0, y: 0 },
    origin: { x: 0.5, y: 0 }
  }
};

export const extensionFontFamilies: {
  [key: string]: { [key: string]: { [key: string]: TLFontFace } };
} = {
  Nunito: {
    normal: {
      normal: {
        family: 'Nunito',
        src: {
          url: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofINeaBTMnFcQ.woff2',
          format: 'woff2'
        },
        weight: '500',
        style: 'normal'
      },
      bold: {
        family: 'Nunito',
        src: {
          url: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofINeaBTMnFcQ.woff2',
          format: 'woff2'
        },
        weight: '700',
        style: 'normal'
      }
    },
    italic: {
      normal: {
        family: 'Nunito',
        src: {
          url: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofINeaBTMnFcQ.woff2',
          format: 'woff2'
        },
        weight: '500',
        style: 'normal'
      },
      bold: {
        family: 'Nunito',
        src: {
          url: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofINeaBTMnFcQ.woff2',
          format: 'woff2'
        },
        weight: '700',
        style: 'normal'
      }
    }
  }
} satisfies Record<string, TLDefaultFont>;

const fontFaces = Object.values(extensionFontFamilies)
  .map(fontFamily => Object.values(fontFamily))
  .flat()
  .map(fontStyle => Object.values(fontStyle))
  .flat();

const font = extensionFontFamilies['Nunito'].normal.normal.src.url;

export const assetUrls = {
  fonts: {
    tldraw_draw: font,
    tldraw_draw_bold: font,
    tldraw_draw_italic: font,
    tldraw_draw_bold_italic: font,
    tldraw_draw_italic_bold: font
  }
};

export const bootstrapEditor = (editor: Editor) => {
  editor.fonts.requestFonts(fontFaces);
};

export const convertRoomSnapshotToStoreSnapshot = (snapshot: RoomSnapshot): TLStoreSnapshot => {
  return {
    store: Object.fromEntries(snapshot.documents.map(d => [d.state.id, d.state])),
    schema: snapshot.schema
  } as TLStoreSnapshot;
};
