import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useEditJustificationComment } from '@/services/api/identifications';
import { Feedback } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface EditCommentModalProps {
  feedback: Feedback;
  onSaved: (comment: string, mode: 'replace' | 'amend') => void;
}

const EditCommentFields = z.object({
  comment: z.string().trim().min(1, 'Comment is required')
});

type EditCommentFields = z.infer<typeof EditCommentFields>;

const EDIT_WINDOW_MS = 60 * 60 * 1000;

const EditCommentForm: FC<ModalProps<EditCommentModalProps>> = props => {
  const modalProps = props.props;
  if (!modalProps) throw new Error('feedback is required');

  const { feedback } = modalProps;
  const canReplaceOriginal = Date.now() - new Date(feedback.createdAt).getTime() < EDIT_WINDOW_MS;
  const editComment = useEditJustificationComment();
  const methods = useForm<EditCommentFields>({
    resolver: zodResolver(EditCommentFields),
    defaultValues: { comment: canReplaceOriginal ? (feedback.comment ?? '') : '' }
  });

  const submit = async ({ comment }: EditCommentFields) => {
    const result = await editComment.mutateAsync({ id: feedback.id, comment });
    modalProps.onSaved(comment.trim(), result.mode);
    props.close();
  };

  return (
    <Form className="flex flex-col gap-4" methods={methods} onSubmit={submit}>
      <div>
        <h1 className="text-2xl font-bold text-accent-900">{canReplaceOriginal ? 'Edit comment' : 'Amend comment'}</h1>
        <p className="mt-1 text-sm leading-snug text-accent-800">
          {canReplaceOriginal
            ? 'You submitted this less than an hour ago, so saving will update the original comment.'
            : 'It has been more than an hour, so your update will be added below the original as an amendment.'}
        </p>
      </div>

      {!canReplaceOriginal && (
        <div className="rounded-lg border border-accent-200 bg-white/50 px-3 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-700">Original comment</p>
          <p className="mt-1 break-words text-sm leading-snug text-accent-900">{feedback.comment}</p>
        </div>
      )}

      <Field name="comment">
        <TextAreaField placeholder={canReplaceOriginal ? 'Edit your comment' : 'Add your amendment'} />
      </Field>
      <Button loading={editComment.isPending} type="submit" className="place-self-end">
        {canReplaceOriginal ? 'save changes' : 'add amendment'}
      </Button>
    </Form>
  );
};

export const EditCommentModal: FC<ModalProps<EditCommentModalProps>> = props => (
  <Modal
    className="w-[calc(100vw-2rem)] max-w-2xl rounded-lg bg-accent-100 px-5 py-5 text-accent-900 ring-4 ring-inset ring-accent-300 sm:px-8 sm:py-6"
    {...props}
  >
    {props.props && <EditCommentForm {...props} />}
  </Modal>
);
