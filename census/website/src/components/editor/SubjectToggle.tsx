import { useEditor } from '@/services/video/hooks';
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
    <div className="flex gap-2 mb-4">
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
