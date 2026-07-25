import SiBug2 from '@/components/icons/SiBug2';
import { useEditor } from '@/services/video/hooks';
import { Plus } from 'lucide-react';
import { Button } from '../controls/button/juicy';
import { CustomSelectionColor } from './CustomSelectionColor';

export const SubjectToggle = () => {
  const { subjects, selectedSubjectId, selectSubject, createNewSubject } = useEditor(state => ({
    subjects: state.subjects,
    selectedSubjectId: state.selectedSubjectId,
    selectSubject: state.selectSubject,
    createNewSubject: state.createNewSubject
  }));
  return (
    <div className="flex flex-wrap gap-2">
      {subjects.map(subject => {
        const toggled = selectedSubjectId === subject.id;
        return (
          <CustomSelectionColor key={subject.id} id={subject.id}>
            <Button variant="custom" data-toggled={toggled} onClick={() => selectSubject(subject.id)}>
              {subject.nickname}
            </Button>
          </CustomSelectionColor>
        );
      })}
      {subjects.length < 3 && (
        <Button variant="alveus" onClick={() => createNewSubject()}>
          add subject
        </Button>
      )}
    </div>
  );
};

export const MobileSubjectButtons = () => {
  const { subjects, selectedSubjectId, selectSubject, createNewSubject } = useEditor(state => ({
    subjects: state.subjects,
    selectedSubjectId: state.selectedSubjectId,
    selectSubject: state.selectSubject,
    createNewSubject: state.createNewSubject
  }));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {subjects.map(subject => (
        <CustomSelectionColor key={subject.id} id={subject.id}>
          <Button
            variant="custom"
            aria-label={`Select ${subject.nickname}`}
            title={subject.nickname}
            className="size-11 shrink-0 p-0 active:p-0 data-[toggled=true]:p-0"
            data-toggled={selectedSubjectId === subject.id}
            onClick={() => selectSubject(subject.id)}
          >
            <SiBug2 className="size-5" />
          </Button>
        </CustomSelectionColor>
      ))}
      {subjects.length < 3 && (
        <Button
          variant="alveus"
          aria-label="Add subject"
          title="Add subject"
          className="size-11 shrink-0 p-0 active:p-0"
          onClick={createNewSubject}
        >
          <Plus className="size-5" />
        </Button>
      )}
    </div>
  );
};
