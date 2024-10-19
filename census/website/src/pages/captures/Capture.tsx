import { usePermissions } from '@/services/permissions/hooks';
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

  if (editor) return <Editor id={id} />;
  return <ReadOnly id={id} />;
};
