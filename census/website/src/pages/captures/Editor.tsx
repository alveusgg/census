import { Save } from '@/components/assets/icons/Save';
import { Button } from '@/components/controls/button/juicy';
import { CustomSelectionColor } from '@/components/editor/CustomSelectionColor';
import { SelectedSubjectHighlight } from '@/components/editor/SelectedSubjectHighlight';
import { SubjectSelectionInput } from '@/components/editor/SubjectSelectionInput';
import { SubjectToggle } from '@/components/editor/SubjectToggle';
import { AutoVideo } from '@/components/editor/video/AutoVideo';
import { PlaybackBar } from '@/components/editor/video/PlaybackBar';
import { VideoContainer } from '@/components/editor/VideoContainer';
import { usePointAction } from '@/components/points/hooks';
import { PointOrigin } from '@/components/points/PointOrigin';
import { Breadcrumbs } from '@/layouts/Breadcrumbs';
import { useCapture, useCreateObservationsFromCapture } from '@/services/api/capture';
import { useEditor } from '@/services/video/hooks';
import { Selection } from '@alveusgg/census-api/src/services/observations/observations';
import * as Media from '@react-av/core';
import { useMeasure } from '@uidotdev/usehooks';
import { FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CaptureProps } from './Capture';

const EDITOR_GAP = 24;

const useEditorViewportHeight = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const updateHeight = () => {
      const scrollViewport = element.closest('[data-radix-scroll-area-viewport]');
      const bottomEdge = scrollViewport?.getBoundingClientRect().bottom ?? window.innerHeight;
      const topEdge = element.getBoundingClientRect().top;
      const parentStyle = element.parentElement ? getComputedStyle(element.parentElement) : undefined;
      const bottomPadding = parentStyle ? Number.parseFloat(parentStyle.paddingBottom) || 0 : 0;

      setHeight(Math.max(bottomEdge - topEdge - bottomPadding, 0));
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);

    const scrollViewport = element.closest('[data-radix-scroll-area-viewport]');
    if (scrollViewport) observer.observe(scrollViewport);

    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [element]);

  return [ref, height] as const;
};

export const Editor: FC<CaptureProps> = ({ id }) => {
  const capture = useCapture(id);
  const navigate = useNavigate();
  const action = usePointAction();
  const [editorRef, editorHeight] = useEditorViewportHeight();
  const [controlsRef, { height: controlsHeight }] = useMeasure<HTMLDivElement>();

  const createObservationsFromCapture = useCreateObservationsFromCapture();
  const { selectedSubjectId, selections } = useEditor(state => state);

  const onSubmit = async () => {
    const subjects = new Map<number, Selection[]>();
    Object.entries(selections).forEach(([time, selections]) => {
      selections.forEach(selection => {
        const timestamp = Number(time);
        const existing = subjects.get(selection.subjectId) ?? [];
        const payload = {
          timestamp,
          boundingBox: selection.boundingBox
        };
        subjects.set(selection.subjectId, [...existing, payload]);
      });
    });

    const payloads = Array.from(subjects.values());
    await Promise.all([
      action.add(150),
      createObservationsFromCapture.mutateAsync({
        captureId: id,
        observations: payloads
      })
    ]);
    navigate(`/observations`);
  };

  const videoUrl = capture.data.muxPlaybackId
    ? `https://stream.mux.com/${capture.data.muxPlaybackId}.m3u8`
    : (capture.data.lowQualityVideoUrl ?? capture.data.videoUrl);
  const videoSlotHeight = Math.max((editorHeight ?? 0) - (controlsHeight ?? 0) - EDITOR_GAP, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col" ref={editorRef} style={{ height: editorHeight || undefined }}>
      <CustomSelectionColor id={selectedSubjectId}>
        <Breadcrumbs>
          <p>home</p>
          <span>•</span>
          <p className="text-lg">choose subjects</p>
        </Breadcrumbs>
        <Media.Root>
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="min-h-0 shrink-0" style={{ height: videoSlotHeight }}>
              <VideoContainer>
                <SubjectSelectionInput />
                {videoUrl && (
                  <AutoVideo src={videoUrl} className="h-full w-full aspect-video object-cover bg-black" muted loop />
                )}
                <SelectedSubjectHighlight />
              </VideoContainer>
            </div>
            <div className="min-w-0 shrink-0" ref={controlsRef}>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SubjectToggle />
                <PointOrigin {...action}>
                  <Button loading={createObservationsFromCapture.isPending} onClick={onSubmit} shortcut="S">
                    <Save />
                    Save
                  </Button>
                </PointOrigin>
              </div>
              <PlaybackBar />
            </div>
          </div>
        </Media.Root>
      </CustomSelectionColor>
    </div>
  );
};
