import { Save } from '@/components/assets/icons/Save';
import { Button } from '@/components/controls/button/juicy';
import { CustomSelectionColor } from '@/components/editor/CustomSelectionColor';
import { SelectedSubjectHighlight } from '@/components/editor/SelectedSubjectHighlight';
import { SubjectSelectionInput } from '@/components/editor/SubjectSelectionInput';
import { SubjectToggle } from '@/components/editor/SubjectToggle';
import { AutoVideo } from '@/components/editor/video/AutoVideo';
import { PlaybackBar } from '@/components/editor/video/PlaybackBar';
import { VideoContainer } from '@/components/editor/VideoContainer';
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
    await createObservationsFromCapture.mutateAsync({ captureId: id, observations: payloads });
    navigate(`/observations`);
  };

  const videoUrl = capture.data.muxPlaybackId
    ? `https://stream.mux.com/${capture.data.muxPlaybackId}.m3u8`
    : capture.data.videoUrl;

  return (
    <div className="flex-1 flex flex-col gap-6 items-center">
      <CustomSelectionColor id={selectedSubjectId}>
        <Breadcrumbs>
          <p>home</p>
          <span>•</span>
          <p className="text-lg">choose subjects</p>
        </Breadcrumbs>
        <AnimatePresence initial={false} mode="popLayout"></AnimatePresence>
        <Media.Root>
          <VideoContainer>
            <SubjectSelectionInput />
            {videoUrl && (
              <AutoVideo src={videoUrl} className="w-full aspect-video object-cover h-full bg-black" muted loop />
            )}
            <SelectedSubjectHighlight />
          </VideoContainer>
          <div className="w-full">
            <div className="flex justify-between items-center">
              <SubjectToggle />
              <Button loading={createObservationsFromCapture.isPending} onClick={onSubmit} shortcut="S">
                <Save />
                Save
              </Button>
            </div>
            <PlaybackBar />
          </div>
        </Media.Root>
      </CustomSelectionColor>
    </div>
  );
};
