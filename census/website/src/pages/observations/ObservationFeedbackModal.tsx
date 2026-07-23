import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { usePointAction } from '@/components/points/hooks';
import { PointOrigin } from '@/components/points/PointOrigin';
import { useAddFeedbackToIdentification } from '@/services/api/identifications';
import { Identification } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface IdentificationFeedbackModalProps {
  identification: Identification;
  feedback: 'agree' | 'disagree';
}

const IdentificationFeedbackFields = z.object({
  comment: z.string().optional()
});

type IdentificationFeedbackFields = z.infer<typeof IdentificationFeedbackFields>;

const label: Record<IdentificationFeedbackModalProps['feedback'], string> = {
  agree: 'What makes you agree?',
  disagree: 'What makes you disagree?'
};

const IdentificationFeedbackForm: FC<ModalProps<IdentificationFeedbackModalProps>> = props => {
  const action = usePointAction();
  const feedback = props.props?.feedback;
  const identification = props.props?.identification;
  if (!feedback) throw new Error('feedback is required');
  if (!identification) throw new Error('identification is required');

  const addFeedback = useAddFeedbackToIdentification();

  const methods = useForm<IdentificationFeedbackFields>({
    resolver: zodResolver(IdentificationFeedbackFields)
  });

  const comment = methods.watch('comment');

  const submitFeedback = async (data: IdentificationFeedbackFields) => {
    const result = await addFeedback.mutateAsync({ id: identification.id, type: feedback, comment: data.comment });
    if (result.pointsAwarded > 0) {
      await action.add(result.pointsAwarded);
    }
    props.close();
  };
  return (
    <Form className="flex flex-col gap-3" methods={methods} onSubmit={submitFeedback}>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold flex justify-between items-center gap-1">
          <span>Submit feedback for {identification.name}</span>
        </h1>
        <p className="leading-tight">{label[feedback]}</p>
      </div>
      <Field name="comment">
        <TextAreaField
          aria-describedby="feedback-comment-guidance"
          aria-label="Comment"
          placeholder="Please explain your reasoning"
        />
      </Field>
      <p id="feedback-comment-guidance" className="rounded-md border border-accent-300 bg-accent-50 px-3 py-2 text-sm">
        <strong>Make it useful:</strong> mention a visible feature or comparison that supports your view. Avoid vague
        comments like “correct” or “could be”, or citing someone else.
      </p>
      <PointOrigin className="place-self-end" {...action}>
        <Button loading={addFeedback.isPending || action.isPending} type="submit">
          {comment ? 'submit' : `${feedback} without comment`}
        </Button>
      </PointOrigin>
    </Form>
  );
};

export const IdentificationFeedbackModal: FC<ModalProps<IdentificationFeedbackModalProps>> = props => {
  return (
    <Modal
      title={`Submit feedback for ${props.props?.identification.name ?? 'identification'}`}
      className="bg-accent-100 text-accent-900 ring-4 ring-accent-300 ring-inset rounded-lg px-8 py-6 w-full max-w-2xl"
      {...props}
    >
      <IdentificationFeedbackForm {...props} />
    </Modal>
  );
};
