import { DownThumb, UpThumb } from '@/components/controls/ObservationEntry';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { Feedback } from '@/services/api/observations';
import { FC } from 'react';

export interface FeedbackModalProps {
  feedback: Feedback[];
}

const FeedbackList: FC<FeedbackModalProps> = props => {
  const agree: { comments: Feedback[]; votes: Feedback[] } = { comments: [], votes: [] };
  const disagree: { comments: Feedback[]; votes: Feedback[] } = { comments: [], votes: [] };

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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-accent-900">Feedback</h1>
        <p className="text-accent-900">
          Here you can see what the rest of the community thinks about this identification.
        </p>
      </div>

      {(agree.comments.length > 0 || agree.votes.length > 0) && (
        <div className="border-y border-accent py-2">
          <h3 className="font-bold text-accent-900">Agree</h3>
          <p>
            {agree.votes.map(vote => (
              <span className="flex items-center gap-1 text-purple-500 font-bold" key={vote.id}>
                <UpThumb />
                <span>{vote.submitter.username}</span>
              </span>
            ))}
          </p>
          {agree.comments.length > 0 && (
            <div className="flex flex-col gap-2 divide-y divide-accent divide-dashed mt-2 border-t border-accent text-accent-900">
              {agree.comments.map(comment => (
                <div key={comment.id} className="pt-2">
                  <p>{comment.comment}</p>
                  <p className="text-accent-700 text-sm font-semibold">by {comment.submitter.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(disagree.comments.length > 0 || disagree.votes.length > 0) && (
        <div className="border-y border-accent py-2">
          <h3 className="font-bold text-accent-900">Disagree</h3>
          <p>
            {disagree.votes.map(vote => (
              <span className="flex items-center gap-1 text-red-500 font-bold" key={vote.id}>
                <DownThumb />
                <span>{vote.submitter.username}</span>
              </span>
            ))}
          </p>
          {disagree.comments.length > 0 && (
            <div className="flex flex-col gap-2 divide-y divide-accent divide-dashed mt-2 border-t border-accent text-accent-900">
              {disagree.comments.map(comment => (
                <div key={comment.id} className="pt-2">
                  <p>{comment.comment}</p>
                  <p className="text-accent-700 text-sm font-semibold">by {comment.submitter.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const FeedbackModal: FC<ModalProps<FeedbackModalProps>> = props => {
  return (
    <Modal className="bg-accent-100" {...props}>
      {props.props?.feedback && <FeedbackList feedback={props.props.feedback} />}
    </Modal>
  );
};
