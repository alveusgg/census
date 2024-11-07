import { useCapture } from '@/services/api/capture';
import { usePermissions } from '@/services/permissions/hooks';
import { CaptureEditorProvider } from '@/services/video/CaptureEditorProvider';
import { FC, useMemo } from 'react';
import { Navigate, useParams } from 'react-router';
import { Editor } from './Editor';
import { ReadOnly } from './ReadOnly';

export interface CaptureProps {
  id: number;
}

export const CaptureRedirect: FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/snapshots/${id}`} />;
};

export const Capture: FC = () => {
  const { editor } = usePermissions();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);
  const capture = useCapture(id);

  if (!editor) throw new Error('Editor permission required');
  if (capture.data.observations.length > 0) return <ReadOnly id={id} />;

  return (
    <CaptureEditorProvider>
      <Editor id={id} />
    </CaptureEditorProvider>
  );
};
