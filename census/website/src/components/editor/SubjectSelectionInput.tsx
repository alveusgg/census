import { useEditor } from '@/services/video/hooks';
import * as Media from '@react-av/core';
import { SelectionInput } from '../forms/inputs/SelectionInput';

export const SubjectSelectionInput = () => {
  const [time] = Media.useMediaCurrentTimeFine();
  const [playing] = Media.useMediaPlaying();
  const { selections, setSelections, selectedSubjectId } = useEditor(state => state);

  if (playing) return null;
  return (
    <div className="absolute inset-0">
      <SelectionInput
        value={selections[time] ?? []}
        currentSubjectId={selectedSubjectId}
        onChange={next => setSelections(time, next)}
      />
    </div>
  );
};
