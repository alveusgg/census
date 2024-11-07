import { useActions } from '@/services/points/PointsProvider';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

export const PointDestination = () => {
  const actions = useActions();

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-10">
      {actions.map(action => (
        <motion.div
          key={action.id}
          className={cn(
            'text-white bg-[#B877F9] min-w-12 w-fit px-3 py-1 rounded-full font-bold flex justify-center items-center z-10',
            'shadow-[inset_0_-1px_6px_4px_rgba(0,0,0,0.08)]'
          )}
          layout="position"
          layoutId={`point-origin-${action.id}`}
        >
          <p className="font-mono">
            <span className="font-medium text-sm">+</span>
            {action.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
