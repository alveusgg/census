import { useContext } from 'react';
import { useStore } from 'zustand';
import { CaptureEditorActions, CaptureEditorContext, CaptureEditorStore } from './CaptureEditorProvider';

export function useEditor<U>(selector: (store: CaptureEditorStore & CaptureEditorActions) => U): U {
  const context = useContext(CaptureEditorContext);
  if (!context) {
    throw new Error('useCaptureEditor must be used within a CaptureEditorProvider');
  }
  return useStore(context, selector);
}
