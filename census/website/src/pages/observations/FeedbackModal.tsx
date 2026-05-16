import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { UserLink } from '@/components/users/UserLink';
import { Feedback } from '@/services/api/observations';
import { cn } from '@/utils/cn';
import { FC } from 'react';

export interface FeedbackModalProps {
  feedback: Feedback[];
}

interface FeedbackGroup {
  comments: Feedback[];
  votes: Feedback[];
}

const FeedbackVoteChip: FC<{ feedback: Feedback; tone: 'agree' | 'disagree' }> = ({ feedback, tone }) => {
  const Icon = tone === 'agree' ? UpThumb : DownThumb;

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold',
        tone === 'agree'
          ? 'border-purple-100 bg-purple-50 text-purple-600'
          : 'border-red-100 bg-red-50 text-red-600'
      )}
    >
      <Icon className="shrink-0" />
      <UserLink user={feedback.submitter} className="min-w-0 truncate" />
    </span>
  );
};

const FeedbackCommentCard: FC<{ feedback: Feedback; tone: 'agree' | 'disagree' }> = ({ feedback, tone }) => {
  const Icon = tone === 'agree' ? UpThumb : DownThumb;

  return (
    <article className="min-w-0 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5 text-accent-900">
      <p className="break-words leading-snug">{feedback.comment}</p>
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
  tone: 'agree' | 'disagree';
  group: FeedbackGroup;
}> = ({ title, tone, group }) => {
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
              <FeedbackCommentCard key={comment.id} feedback={comment} tone={tone} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const FeedbackList: FC<FeedbackModalProps> = props => {
  const agree: FeedbackGroup = { comments: [], votes: [] };
  const disagree: FeedbackGroup = { comments: [], votes: [] };

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
    }
  });

  const hasFeedback = agree.comments.length + agree.votes.length + disagree.comments.length + disagree.votes.length > 0;

  return (
    <div className="flex max-h-[min(80vh,42rem)] w-full min-w-0 flex-col gap-5 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-accent-900">Feedback</h1>
        <p className="mt-1 max-w-prose break-words text-sm leading-snug text-accent-800">
          Here you can see what the rest of the community thinks about this identification.
        </p>
      </div>

      {hasFeedback ? (
        <div className="grid min-w-0 gap-3">
          <FeedbackSection title="Agree" tone="agree" group={agree} />
          <FeedbackSection title="Disagree" tone="disagree" group={disagree} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-accent-300 bg-accent-50 px-4 py-8 text-center text-sm font-medium text-accent-800">
          No feedback has been submitted yet.
        </div>
      )}
    </div>
  );
};

export const FeedbackModal: FC<ModalProps<FeedbackModalProps>> = props => {
  return (
    <Modal className="w-[calc(100vw-2rem)] max-w-2xl bg-accent-100 p-4 sm:p-5" {...props}>
      {props.props?.feedback && <FeedbackList feedback={props.props.feedback} />}
    </Modal>
  );
};
