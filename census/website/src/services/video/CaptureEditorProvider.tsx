import { createContext, FC, PropsWithChildren, useRef } from 'react';
import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generatePlaceholderNickname, makeNickname } from './utils';

interface Subject {
  id: number;
  nickname: string;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Timestamp = number;
export interface Selection {
  subjectId: number;
  boundingBox: BoundingBox;
}

export interface CaptureEditorStore {
  selectedSubjectId: number;
  subjects: Subject[];
  selections: Record<Timestamp, Selection[]>;
}

export interface CaptureEditorActions {
  createNewSubject: () => void;
  selectSubject: (subjectId: number) => void;
  updateSelection: (timestamp: Timestamp, selectionId: number, boundingBox: BoundingBox, thumbnail?: string) => void;
}

export const CaptureEditorContext = createContext<StoreApi<CaptureEditorStore & CaptureEditorActions> | null>(null);

interface CaptureEditorProviderProps {
  subjects?: Subject[];
  selections?: Record<Timestamp, Selection[]>;
}

export const CaptureEditorProvider: FC<PropsWithChildren<CaptureEditorProviderProps>> = ({
  children,
  subjects = [{ id: 0, nickname: makeNickname() }],
  selections = {}
}) => {
  const store = useRef(
    create<CaptureEditorStore & CaptureEditorActions>()(
      immer((set, get) => ({
        subjects,
        selections,
        selectedSubjectId: 0,
        createNewSubject: () => {
          const existing = get().subjects.map(s => s.nickname);
          const nickname = generatePlaceholderNickname(existing);
          set(draft => {
            const id = draft.subjects.length;
            draft.subjects.push({ id, nickname });
            draft.selectedSubjectId = id;
          });
        },
        selectSubject: subjectId => {
          set(draft => {
            draft.selectedSubjectId = subjectId;
          });
        },
        updateSelection: (timestamp, selectionId, boundingBox) => {
          set(draft => {
            if (!(timestamp in draft.selections)) {
              draft.selections[timestamp] = [];
            }
            const selection = draft.selections[timestamp].findIndex(s => s.subjectId === selectionId);
            if (selection === -1) {
              draft.selections[timestamp].push({ subjectId: selectionId, boundingBox });
              return;
            }
            draft.selections[timestamp][selection].boundingBox = boundingBox;
          });
        }
      }))
    )
  );

  return <CaptureEditorContext.Provider value={store.current}>{children}</CaptureEditorContext.Provider>;
};
