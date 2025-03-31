import SiNotebook from '@/components/icons/SiNotebook';
import { FC } from 'react';
import { DefaultMainMenu, SVGContainer, track, useEditor } from 'tldraw';
import { WIDTH } from './utils';

export const Background: FC<{ mode: 'edit' | 'view' }> = ({ mode }) => {
  return (
    <div className="absolute inset-0">
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `700px`,
          boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.05)',
          height: `100vh`,
          backgroundColor: 'white',
          opacity: mode === 'view' ? 0.1 : 1,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export const ContentMask = track(function ContentMask({ mode }: { mode: 'edit' | 'view' }) {
  const editor = useEditor();

  const viewportScreenBounds = editor.getViewportScreenBounds();
  const viewportPath = `M 0 0 L ${viewportScreenBounds.w} 0 L ${viewportScreenBounds.w} ${viewportScreenBounds.h} L 0 ${viewportScreenBounds.h} Z`;

  const x = viewportScreenBounds.w / 2 - WIDTH / 2;
  const y = 0;
  const maxY = viewportScreenBounds.h;
  const maxX = viewportScreenBounds.w / 2 + WIDTH / 2;

  return (
    <>
      <SVGContainer
        style={{
          pointerEvents: 'none',
          zIndex: 0,
          fillOpacity: mode === 'view' ? 1 : 0.8,
          fill: 'rgb(253 251 237)',
          stroke: 'none'
        }}
      >
        <path
          d={`${viewportPath} ${`M ${x} ${y} L ${maxX} ${y} L ${maxX} ${maxY} L ${x} ${maxY} Z`}`}
          fillRule="evenodd"
        />
      </SVGContainer>
    </>
  );
});

export const MenuPanel: FC = () => {
  return (
    <div className="relative group text-accent-900 py-2 px-6">
      <SiNotebook className="text-2xl absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-accent-100 z-10 group-hover:bg-[#f1f0e4] pointer-events-none" />
      <DefaultMainMenu />
    </div>
  );
};
