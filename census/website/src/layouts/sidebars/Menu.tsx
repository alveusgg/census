import { SimpleAlveus } from '@/components/assets/logos/SimpleAlveus';
import { Wordmark } from '@/components/assets/logos/Wordmark';
import { Button } from '@/components/controls/button/juicy';
import SiCog from '@/components/icons/SiCog';
import SiHome from '@/components/icons/SiHome';
import SiLogOut from '@/components/icons/SiLogOut';
import SiMenu from '@/components/icons/SiMenu';
import SiPhoto from '@/components/icons/SiPhoto';
import SiUser from '@/components/icons/SiUser';
import SiUsers from '@/components/icons/SiUsers';
import { useSidebar } from '@/components/layout/LayoutProvider';
import { usePermissions } from '@/services/api/me';
import { cn } from '@/utils/cn';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { ComponentPropsWithoutRef, ElementType, FC, PropsWithChildren, useRef } from 'react';
import { Link } from 'react-router-dom';

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
  const permissions = usePermissions();
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
            <MenuItem as={Link} to="/">
              <SiHome className="text-2xl" />
              <MenuLabel>home</MenuLabel>
            </MenuItem>
            <MenuItem as={Link} to="/observations">
              <SiPhoto className="text-2xl" />
              <MenuLabel>observations</MenuLabel>
            </MenuItem>
            {/* <MenuItem as={Link} to="/identifications">
              <SiBinoculars className="text-2xl" />
              <MenuLabel>identifications</MenuLabel>
            </MenuItem> */}
            {permissions.data.moderate && (
              <MenuItem as={Link} to="/users">
                <SiUsers className="text-2xl" />
                <MenuLabel>users</MenuLabel>
              </MenuItem>
            )}
            {permissions.data.admin && (
              <MenuItem as={Link} to="/admin">
                <SiCog className="text-2xl" />
                <MenuLabel>admin</MenuLabel>
              </MenuItem>
            )}
          </div>
          <div className="flex flex-col gap-2 py-2 w-full">
            <MenuItem>
              <SiUser className="text-2xl" />
              <MenuLabel>profile</MenuLabel>
            </MenuItem>
            <MenuItem as={Link} to="/auth/signout">
              <SiLogOut className="text-2xl" />
              <MenuLabel>sign out</MenuLabel>
            </MenuItem>
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
};

type PolymorphicAsProp<E extends ElementType> = {
  as?: E;
};
type PolymorphicProps<E extends ElementType> = PropsWithChildren<ComponentPropsWithoutRef<E> & PolymorphicAsProp<E>>;

type MenuItemProps<E extends ElementType = 'button'> = PolymorphicProps<E>;

export function MenuItem<E extends ElementType = 'button'>({ className, as, onClick, ...props }: MenuItemProps<E>) {
  const [open, setOpen] = useSidebar();
  const pointerTimeoutHandle = useRef<NodeJS.Timeout | null>(null);

  const Component = as ?? 'button';

  return (
    <Component
      onClick={(...args) => {
        // If the user clicked the item, we don't want to open the sidebar. They know what they're doing.
        if (onClick) onClick(...args);

        if (!pointerTimeoutHandle.current) return;
        clearTimeout(pointerTimeoutHandle.current);
        pointerTimeoutHandle.current = null;
      }}
      onPointerEnter={() => {
        // If the user hovers over the item, we want to open the sidebar after a delay.
        pointerTimeoutHandle.current = setTimeout(() => {
          setOpen(true);
        }, 1000);
      }}
      onPointerLeave={() => {
        // If the user leaves the item, we want to cancel the sidebar open delay.
        if (!pointerTimeoutHandle.current) return;
        clearTimeout(pointerTimeoutHandle.current);
        pointerTimeoutHandle.current = null;
      }}
      className={cn(
        'py-1.5 px-4 flex items-center hover:bg-alveus hover:bg-opacity-5 rounded-lg font-medium text-alveus-darker',
        open ? 'w-full' : 'w-fit',
        className
      )}
      {...props}
    />
  );
}

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
