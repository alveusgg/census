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
import { AnimatePresence } from 'framer-motion';
import { FC } from 'react';
import { useNavigate } from 'react-router';
import { CaptureProps } from './Capture';

export const Editor: FC<CaptureProps> = ({ id }) => {
  const capture = useCapture(id);
  const navigate = useNavigate();
  const action = usePointAction();

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

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-6">
      <CustomSelectionColor id={selectedSubjectId}>
        <Breadcrumbs>
          <p>home</p>
          <span>•</span>
          <p className="text-lg">choose subjects</p>
        </Breadcrumbs>
        <AnimatePresence initial={false} mode="popLayout"></AnimatePresence>
        <Media.Root>
          <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
            <VideoContainer>
              <SubjectSelectionInput />
              {videoUrl && (
                <AutoVideo src={videoUrl} className="absolute inset-0 h-full w-full bg-black object-cover" muted loop />
              )}
              <SelectedSubjectHighlight />
            </VideoContainer>
            <div className="min-w-0 shrink-0">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SubjectToggle />
                <p className="rounded-lg border border-accent-300 bg-accent-100 px-3 py-2 text-center text-sm font-bold text-accent-800 lg:ml-auto">
                  this might look a little blurry but the final pictures won&rsquo;t be!
                </p>
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
