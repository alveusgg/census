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
    <header className="h-[4rem] pr-12 pl-8 pt-2 flex items-center justify-between text-alveus-darker font-semibold relative">
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
      <div className="absolute border-b border-dashed border-alveus border-opacity-50 inset-y-0 left-8 right-12 pointer-events-none" />
    </header>
  );
};
