import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import SiClose from '@/components/icons/SiClose';
import SiPencil from '@/components/icons/SiPencil';
import { Confirm, useConfirm } from '@/components/modal/Confirm';
import { Modal } from '@/components/modal/Modal';
import { ModalProps, useModal } from '@/components/modal/useModal';
import { UserLink } from '@/components/users/UserLink';
import { useRemoveFeedbackComment } from '@/services/api/identifications';
import { Feedback } from '@/services/api/observations';
import { useMe } from '@/services/api/me';
import { useHasPermission } from '@/services/permissions/hooks';
import { cn } from '@/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FC } from 'react';
import { EditCommentModal, EditCommentModalProps } from './EditCommentModal';

export interface FeedbackModalProps {
  feedback: Feedback[];
}

interface FeedbackGroup {
  comments: Feedback[];
  votes: Feedback[];
}

type VoteTone = 'agree' | 'disagree';

const FeedbackVoteChip: FC<{ feedback: Feedback; tone: VoteTone }> = ({ feedback, tone }) => {
  const Icon = tone === 'agree' ? UpThumb : DownThumb;

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold',
        tone === 'agree' ? 'border-purple-100 bg-purple-50 text-purple-600' : 'border-red-100 bg-red-50 text-red-600'
      )}
    >
      <Icon className="shrink-0" />
      <UserLink user={feedback.submitter} className="min-w-0 truncate" />
    </span>
  );
};

const FeedbackCommentCard: FC<{
  feedback: Feedback;
  tone: VoteTone;
  isRemoving?: boolean;
  onRemove?: (feedback: Feedback) => void;
}> = ({ feedback, tone, isRemoving = false, onRemove }) => {
  const Icon = tone === 'agree' ? UpThumb : DownThumb;

  return (
    <article
      className={cn(
        'relative min-w-0 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-accent-900',
        onRemove && 'pr-10'
      )}
    >
      {onRemove && (
        <button
          type="button"
          aria-label={`delete comment from ${feedback.submitter.username}`}
          disabled={isRemoving}
          onClick={() => onRemove(feedback)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-800 hover:bg-red-200 disabled:pointer-events-none disabled:opacity-50"
        >
          <SiClose className="text-lg" />
        </button>
      )}
      <p className="break-words leading-snug">{feedback.comment}</p>
      {[...feedback.edits]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(edit => (
          <p key={edit.id} className="mt-2 break-words text-sm leading-snug text-accent-800">
            <span className="font-bold">Edit:</span> {edit.comment}
          </p>
        ))}
      <p
        className={cn(
          'mt-2 flex min-w-0 items-center gap-1.5 text-sm font-semibold',
          tone === 'agree' ? 'text-purple-600' : 'text-red-600'
        )}
      >
        <Icon className="shrink-0" />
        <UserLink user={feedback.submitter} className="min-w-0 truncate" />
      </p>
    </article>
  );
};

const FeedbackSection: FC<{
  title: string;
  tone: VoteTone;
  group: FeedbackGroup;
  isRemovingComment?: boolean;
  onRemoveComment?: (feedback: Feedback) => void;
}> = ({ title, tone, group, isRemovingComment = false, onRemoveComment }) => {
  const Icon = tone === 'agree' ? UpThumb : DownThumb;
  const total = group.votes.length + group.comments.length;

  if (total === 0) return null;

  return (
    <section className="min-w-0 rounded-xl border border-accent-200 bg-white/45 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-accent-900">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              tone === 'agree' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'
            )}
          >
            <Icon />
          </span>
          <span className="min-w-0 truncate">{title}</span>
        </h2>
        <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-sm font-bold text-accent-800">
          {total} {total === 1 ? 'person' : 'people'}
        </span>
      </div>

      {group.votes.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-accent-700">Votes</h3>
          <div className="flex min-w-0 flex-wrap gap-2">
            {group.votes.map(vote => (
              <FeedbackVoteChip key={vote.id} feedback={vote} tone={tone} />
            ))}
          </div>
        </div>
      )}

      {group.comments.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-accent-700">Comments</h3>
          <div className="flex min-w-0 flex-col gap-2">
            {group.comments.map(comment => (
              <FeedbackCommentCard
                key={comment.id}
                feedback={comment}
                tone={tone}
                isRemoving={isRemovingComment}
                onRemove={onRemoveComment}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const SuggestionCommentCard: FC<{ feedback: Feedback; onEdit?: (feedback: Feedback) => void }> = ({
  feedback,
  onEdit
}) => {
  return (
    <figure className="relative min-w-0 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 pr-10 text-accent-900">
      {onEdit && (
        <button
          type="button"
          aria-label="edit your comment"
          onClick={() => onEdit(feedback)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-800 hover:bg-accent-200"
        >
          <SiPencil className="text-base" />
        </button>
      )}
      <blockquote>
        <p className="break-words text-pretty leading-snug">{feedback.comment}</p>
        {[...feedback.edits]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map(edit => (
            <p key={edit.id} className="mt-2 break-words text-sm leading-snug text-accent-800">
              <span className="font-bold">Edit:</span> {edit.comment}
            </p>
          ))}
      </blockquote>
      <figcaption className="mt-2 text-sm italic text-accent-800">
        - <UserLink user={feedback.submitter} className="font-semibold" />
      </figcaption>
    </figure>
  );
};

const SuggestionCommentList: FC<{
  comments: Feedback[];
  onEdit?: (feedback: Feedback) => void;
  editableUserId?: number;
}> = ({ comments, onEdit, editableUserId }) => {
  if (comments.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {comments.map(comment => (
        <SuggestionCommentCard
          key={comment.id}
          feedback={comment}
          onEdit={comment.userId === editableUserId ? onEdit : undefined}
        />
      ))}
    </div>
  );
};

const FeedbackList: FC<FeedbackModalProps & Pick<ModalProps<FeedbackModalProps>, 'open'>> = props => {
  const { data: me } = useSuspenseQuery(useMe());
  const canModerate = useHasPermission('moderate');
  const editCommentModal = useModal<EditCommentModalProps>();
  const confirmRemoveComment = useConfirm();
  const removeFeedbackComment = useRemoveFeedbackComment();
  const agree: FeedbackGroup = { comments: [], votes: [] };
  const disagree: FeedbackGroup = { comments: [], votes: [] };
  const suggestionComments: Feedback[] = [];

  props.feedback.forEach(feedback => {
    if (feedback.type === 'agree') {
      if (feedback.comment) {
        agree.comments.push(feedback);
      } else {
        agree.votes.push(feedback);
      }
    } else if (feedback.type === 'disagree') {
      if (feedback.comment) {
        disagree.comments.push(feedback);
      } else {
        disagree.votes.push(feedback);
      }
    } else if (feedback.type === 'justification' && feedback.comment) {
      suggestionComments.push(feedback);
    }
  });

  const hasFeedback =
    agree.comments.length +
      agree.votes.length +
      disagree.comments.length +
      disagree.votes.length +
      suggestionComments.length >
    0;
  const removeComment = (comment: Feedback) => {
    confirmRemoveComment.open({
      title: 'Delete comment?',
      description:
        'This will remove the comment and revoke the comment achievement awarded for it. The vote will remain.',
      onConfirm: async () => {
        await removeFeedbackComment.mutateAsync(comment.id);
        props.open({
          feedback: props.feedback.map(feedback =>
            feedback.id === comment.id ? { ...feedback, comment: null } : feedback
          )
        });
      }
    });
  };

  const editComment = (comment: Feedback) => {
    editCommentModal.open({
      feedback: comment,
      onSaved: (text, mode) => {
        props.open({
          feedback: props.feedback.map(feedback => {
            if (feedback.id !== comment.id) return feedback;
            if (mode === 'replace') return { ...feedback, comment: text };
            return {
              ...feedback,
              edits: [
                ...feedback.edits,
                { id: -Date.now(), feedbackId: feedback.id, comment: text, createdAt: new Date() }
              ]
            };
          })
        });
      }
    });
  };

  return (
    <>
      <Confirm {...confirmRemoveComment} />
      <EditCommentModal {...editCommentModal} />
      <div className="flex max-h-[min(80vh,42rem)] w-full min-w-0 flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-accent-900">Feedback</h1>
          <p className="mt-1 max-w-prose break-words text-sm leading-snug text-accent-800">
            Here you can see what the rest of the community thinks about this identification.
          </p>
        </div>

        {hasFeedback ? (
          <div className="grid min-w-0 gap-3">
            <SuggestionCommentList comments={suggestionComments} onEdit={editComment} editableUserId={me.id} />
            <FeedbackSection
              title="Agree"
              tone="agree"
              group={agree}
              isRemovingComment={removeFeedbackComment.isPending}
              onRemoveComment={canModerate ? removeComment : undefined}
            />
            <FeedbackSection
              title="Disagree"
              tone="disagree"
              group={disagree}
              isRemovingComment={removeFeedbackComment.isPending}
              onRemoveComment={canModerate ? removeComment : undefined}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-accent-300 bg-accent-50 px-4 py-8 text-center text-sm font-medium text-accent-800">
            No feedback has been submitted yet.
          </div>
        )}
      </div>
    </>
  );
};

export const FeedbackModal: FC<ModalProps<FeedbackModalProps>> = props => {
  return (
    <Modal className="w-[calc(100vw-2rem)] max-w-2xl bg-accent-100 p-4 sm:p-5" {...props}>
      {props.props?.feedback && <FeedbackList feedback={props.props.feedback} open={props.open} />}
    </Modal>
  );
};
