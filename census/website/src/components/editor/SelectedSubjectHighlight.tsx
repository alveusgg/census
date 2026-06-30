import { useEditor } from '@/services/video/hooks';
import { AnimatePresence, motion } from 'framer-motion';

export const SelectedSubjectHighlight = () => {
  const selectedSubjectId = useEditor(state => state.selectedSubjectId);
  return (
    <AnimatePresence>
      <motion.div
        key={selectedSubjectId}
        initial={{ borderWidth: 0 }}
        animate={{ borderWidth: 4 }}
        exit={{ borderWidth: 0 }}
        className="pointer-events-none absolute inset-0 rounded-md border-white outline outline-[6px] outline-custom"
      ></motion.div>
    </AnimatePresence>
  );
};
