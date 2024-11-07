import { SimpleAlveus } from '@/components/assets/logos/SimpleAlveus';
import { Wordmark } from '@/components/assets/logos/Wordmark';
import { Button } from '@/components/controls/button/juicy';
import SiHome from '@/components/icons/SiHome';
import SiLogOut from '@/components/icons/SiLogOut';
import SiMenu from '@/components/icons/SiMenu';
import SiUser from '@/components/icons/SiUser';
import { useSidebar } from '@/components/layout/LayoutProvider';
import { cn } from '@/utils/cn';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { ComponentProps, FC } from 'react';

export const MenuTrigger = () => {
  const [, setOpen] = useSidebar();
  return (
    <button onClick={() => setOpen(value => !value)}>
      <SiMenu className="text-2xl" />
    </button>
  );
};

export const Menu = () => {
  const [open, setOpen] = useSidebar();
  return (
    <AnimatePresence initial={false}>
      <motion.nav
        className="flex flex-col items-center pt-2 overflow-clip relative"
        transition={{ ease: 'backInOut' }}
        animate={{ width: open ? '12.5rem' : '5rem', minWidth: open ? '12.5rem' : '5rem' }}
      >
        <div className="absolute left-0 bottom-2 top-2 min-w-[12.5rem] w-[12.5rem] flex flex-col flex-1 pl-3 pr-3">
          <div className="flex gap-2 mb-2">
            <Button
              variant="alveus"
              onClick={() => setOpen(value => !value)}
              className="h-[3.5rem] w-[3.5rem] group flex justify-center items-center"
            >
              <SimpleAlveus />
            </Button>
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Wordmark />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-2 py-2 w-full flex-1">
            <MenuItem>
              <SiHome className="text-2xl" />
              <MenuLabel>home</MenuLabel>
            </MenuItem>
          </div>
          <div className="flex flex-col gap-2 py-2 w-full">
            <MenuItem>
              <SiUser className="text-2xl" />
              <MenuLabel>profile</MenuLabel>
            </MenuItem>
            <MenuItem>
              <SiLogOut className="text-2xl" />
              <MenuLabel>sign out</MenuLabel>
            </MenuItem>
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
};

export const MenuItem: FC<ComponentProps<'button'>> = ({ className, ...props }) => {
  const [open] = useSidebar();
  return (
    <button
      className={cn(
        'py-1.5 px-4 flex items-center hover:bg-accent-900 hover:bg-opacity-5 bg-accent-200 rounded-lg font-medium text-alveus-darker',
        open ? 'w-full' : 'w-fit',
        className
      )}
      {...props}
    />
  );
};

const ZeroWidthSeparator = '\u200B';

export const MenuLabel: FC<HTMLMotionProps<'span'>> = ({ className, ...props }) => {
  const [open] = useSidebar();
  return (
    <AnimatePresence>
      {open ? (
        <motion.span
          className={cn('pl-3', className)}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
      ) : (
        <span className="w-0">{ZeroWidthSeparator}</span>
      )}
    </AnimatePresence>
  );
};
