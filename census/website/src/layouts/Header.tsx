import { Button, Link } from '@/components/controls/button/juicy';
import SiTwitch from '@/components/icons/SiTwitch';
import { useModal } from '@/components/modal/useModal';
import { CreateFromClipModal } from '@/pages/captures/create/CreateFromClipModal';
import { useHasPermission } from '@/services/permissions/hooks';
import { MenuTrigger } from './sidebars/Menu';

export const Header = () => {
  const createFromClipModalProps = useModal();
  const hasCapturePermission = useHasPermission('capture');
  const hasBeenOnboarded = useHasPermission('vote');

  return (
    <header className="relative flex h-[4rem] items-center justify-between px-4 pt-2 font-semibold text-alveus-darker sm:pl-8 sm:pr-12">
      <CreateFromClipModal {...createFromClipModalProps} />
      <div className="flex items-center divide-x divide-alveus divide-opacity-50 space-x-4">
        <MenuTrigger />
        <div id="breadcrumbs" className="pl-4"></div>
      </div>
      <div className="flex items-center gap-2">
        {hasCapturePermission && (
          <Button variant="alveus" onClick={() => createFromClipModalProps.open()}>
            <SiTwitch className="text-xl" />
            <span>submit new clip</span>
          </Button>
        )}
        {!hasBeenOnboarded && (
          <Link variant="alveus" to="/forms/onboarding">
            <span>want to help?</span>
          </Link>
        )}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-4 right-4 border-b border-dashed border-alveus border-opacity-50 sm:left-8 sm:right-12" />
    </header>
  );
};
