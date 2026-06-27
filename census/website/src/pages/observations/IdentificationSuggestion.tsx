import { Button } from '@/components/controls/button/paper';
import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import SiBug2 from '@/components/icons/SiBug2';
import SiClose from '@/components/icons/SiClose';
import SiCommentCheck from '@/components/icons/SiCommentCheck';
import SiLeaf from '@/components/icons/SiLeaf';
import SiMessage from '@/components/icons/SiMessage';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { useModal } from '@/components/modal/useModal';
import { UserLink } from '@/components/users/UserLink';
import { useRemoveIdentification } from '@/services/api/identifications';
import { useMe } from '@/services/api/me';
import { Identification as IdentificationType } from '@/services/api/observations';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { ConfirmIdentificationModal, ConfirmIdentificationModalProps } from './ConfirmIdentificationModal';
import { ConfirmationImage } from './ConfirmationAnnotationEditor';
import { FeedbackModal, FeedbackModalProps } from './FeedbackModal';
import { Node } from './helpers';
import { IdentificationFeedbackModal, IdentificationFeedbackModalProps } from './ObservationFeedbackModal';

interface IdentificationSuggestionProps {
  observationImages: ConfirmationImage[];
  tree: Node<IdentificationType>;
}

export const IdentificationSuggestion: FC<IdentificationSuggestionProps> = ({ observationImages, tree }) => {
  const { data: me } = useSuspenseQuery(useMe());
  const identificationFeedbackModalProps = useModal<IdentificationFeedbackModalProps>();
  const confirmIdentificationModalProps = useModal<ConfirmIdentificationModalProps>();
  const feedbackModalProps = useModal<FeedbackModalProps>();
  const confirmRemove = useConfirm();
  const removeIdentification = useRemoveIdentification();

  const canVote = useHasPermission('vote');
  const canConfirm = useHasPermission('confirm');
  const canModerate = useHasPermission('moderate');

  const identification = tree.data;

  const positiveFeedback = identification.feedback.filter(feedback => feedback.type === 'agree');
  const negativeFeedback = identification.feedback.filter(feedback => feedback.type === 'disagree');
  const feedbackWithComments = identification.feedback.filter(feedback => feedback.comment);
  const myFeedback = identification.feedback.find(feedback => feedback.userId === me.id);
  const isOwnSuggestion = identification.suggester?.id === me.id;
  const canRemove = isOwnSuggestion || canModerate;
  const hasFeedback = identification.feedback.length > 0;
  const TaxonIcon = identification.isAccessory ? SiLeaf : SiBug2;

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="py-1 flex flex-col gap-1">
      <IdentificationFeedbackModal {...identificationFeedbackModalProps} />
      <ConfirmIdentificationModal {...confirmIdentificationModalProps} />
      <FeedbackModal {...feedbackModalProps} />
      <Confirm {...confirmRemove} />

      <div className="flex gap-0.5">
        {tree.parent && <Connection />}

        <div className="flex flex-col gap-1 w-full">
          <div className="leading-tight w-full">
            <div className="font-semibold flex items-start w-full justify-between gap-2">
              <div>
                <a
                  href={`https://www.inaturalist.org/taxa/${identification.sourceId}`}
                  target="_blank"
                  className="flex items-center mt-0.5 gap-1"
                >
                  <TaxonIcon className="text-xl" />
                  <span>{identification.name}</span>
                </a>
                <p className="text-sm">
                  suggested by <UserLink user={identification.suggester} className="font-semibold" />
                </p>
              </div>
              {(hasFeedback || canRemove) && (
                <div className="flex shrink-0 items-center gap-1">
                  {hasFeedback && (
                    <Button
                      compact
                      onClick={() => feedbackModalProps.open({ feedback: identification.feedback })}
                      className="flex items-center gap-1"
                    >
                      {positiveFeedback.length > 0 && (
                        <span className="flex items-center gap-0.5 text-purple-500 text-sm font-semibold">
                          <UpThumb />
                          <span>{positiveFeedback.length}</span>
                        </span>
                      )}
                      {negativeFeedback.length > 0 && (
                        <span className="flex items-center gap-0.5 text-red-500 text-sm font-semibold">
                          <DownThumb />
                          <span>{negativeFeedback.length}</span>
                        </span>
                      )}
                      {feedbackWithComments.length > 0 && (
                        <span className="flex items-center text-accent-900 text-sm font-semibold">
                          <SiMessage className="text-xl" />
                          <span>{feedbackWithComments.length}</span>
                        </span>
                      )}
                    </Button>
                  )}
                  {canRemove && (
                    <button
                      type="button"
                      aria-label={`remove suggestion for ${identification.name}`}
                      disabled={removeIdentification.isPending}
                      onClick={() =>
                        confirmRemove.open({
                          title: 'Remove suggestion?',
                          description: `This will remove the suggestion for ${identification.name}. Feedback on this suggestion will also be removed.`,
                          onConfirm: async () => {
                            await removeIdentification.mutateAsync(identification.id);
                          }
                        })
                      }
                      className={cn(
                        'relative flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-800 hover:bg-red-200 disabled:pointer-events-none disabled:opacity-50'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 sm:hidden"
                      />
                      <SiClose className="text-lg" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {canVote && !myFeedback && !isOwnSuggestion && (
              <>
                <Button
                  onClick={() => identificationFeedbackModalProps.open({ feedback: 'agree', identification })}
                  className="text-sm font-semibold px-2.5 py-1"
                  variant="primary"
                >
                  agree
                </Button>
                <Button
                  onClick={() => identificationFeedbackModalProps.open({ feedback: 'disagree', identification })}
                  className="text-sm font-semibold px-2.5 py-1"
                  variant="primary"
                >
                  disagree
                </Button>
              </>
            )}
            {canConfirm && (
              <Button
                onClick={() => confirmIdentificationModalProps.open({ identification, observationImages })}
                className="text-sm font-semibold px-2.5 py-1 gap-0.5"
                variant="primary"
              >
                <SiCommentCheck className="text-xl" />
                confirm
              </Button>
            )}
          </div>
        </div>
      </div>
      {tree.children && tree.children.size > 0 && (
        <div className={cn(tree.parent ? 'ml-8' : 'ml-2')}>
          {Array.from(tree.children).map(child => (
            <IdentificationSuggestion key={child.id} observationImages={observationImages} tree={child} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const Connection = () => {
  return (
    <svg className="m-1" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M13.8301 9.5L9.5 5.16987L5.16987 9.5L9.5 13.8301L13.8301 9.5ZM0.25 0V4.5H1.75V0H0.25ZM6 10.25H9.5V8.75H6V10.25ZM0.25 4.5C0.25 7.67564 2.82436 10.25 6 10.25V8.75C3.65279 8.75 1.75 6.84721 1.75 4.5H0.25Z"
        fill="#753713"
      />
    </svg>
  );
};
