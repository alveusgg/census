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
        className="absolute left-0 top-0 w-full aspect-video outline-[6px] border-white outline outline-custom rounded-md"
      ></motion.div>
    </AnimatePresence>
  );
};
