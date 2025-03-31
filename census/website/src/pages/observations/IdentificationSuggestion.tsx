import { Button } from '@/components/controls/button/paper';
import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import SiBug2 from '@/components/icons/SiBug2';
import SiCommentCheck from '@/components/icons/SiCommentCheck';
import SiMessage from '@/components/icons/SiMessage';
import { useModal } from '@/components/modal/useModal';
import { Identification as IdentificationType } from '@/services/api/observations';
import { useUser } from '@/services/authentication/hooks';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { ConfirmIdentificationModal, ConfirmIdentificationModalProps } from './ConfirmIdentificationModal';
import { FeedbackModal, FeedbackModalProps } from './FeedbackModal';
import { Node } from './helpers';
import { IdentificationFeedbackModal, IdentificationFeedbackModalProps } from './ObservationFeedbackModal';

interface IdentificationSuggestionProps {
  tree: Node<IdentificationType>;
}

export const IdentificationSuggestion: FC<IdentificationSuggestionProps> = ({ tree }) => {
  const me = useUser();
  const identificationFeedbackModalProps = useModal<IdentificationFeedbackModalProps>();
  const confirmIdentificationModalProps = useModal<ConfirmIdentificationModalProps>();
  const feedbackModalProps = useModal<FeedbackModalProps>();

  const canVote = useHasPermission('vote');
  const canConfirm = useHasPermission('confirm');

  const identification = tree.data;

  const positiveFeedback = identification.feedback.filter(feedback => feedback.type === 'agree');
  const negativeFeedback = identification.feedback.filter(feedback => feedback.type === 'disagree');
  const feedbackWithComments = identification.feedback.filter(feedback => feedback.comment);
  const myFeedback = identification.feedback.find(feedback => feedback.userId === me.id);
  const hasFeedback = identification.feedback.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="py-1 flex flex-col gap-1">
      <IdentificationFeedbackModal {...identificationFeedbackModalProps} />
      <ConfirmIdentificationModal {...confirmIdentificationModalProps} />
      <FeedbackModal {...feedbackModalProps} />

      <div className="flex gap-0.5">
        {tree.parent && <Connection />}

        <div className="flex flex-col gap-1 w-full">
          <div className="leading-tight w-full">
            <div className="font-semibold flex items-start w-full justify-between">
              <div>
                <a
                  href={`https://www.inaturalist.org/taxa/${identification.sourceId}`}
                  target="_blank"
                  className="flex items-center mt-0.5 gap-1"
                >
                  <SiBug2 className="text-xl" />
                  <span>{identification.name}</span>
                </a>
                <p className="text-sm">
                  suggested by <span className="font-semibold">{identification.suggester.username}</span>
                </p>
              </div>
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
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {canVote && !myFeedback && (
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
                onClick={() => confirmIdentificationModalProps.open({ identification })}
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
            <IdentificationSuggestion key={child.id} tree={child} />
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
