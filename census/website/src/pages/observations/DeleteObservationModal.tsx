import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { FieldError } from '@/components/forms/Error';
import { Form } from '@/components/forms/Form';
import { SelectField } from '@/components/forms/inputs/SelectInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useDeleteObservation } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface DeleteObservationModalProps {
  observationId: number;
}

const deletionReasons = ['no_valid_subject', 'too_poor_quality'] as const;
type DeletionReason = (typeof deletionReasons)[number];

const deletionReasonOptions: { value: DeletionReason; label: string }[] = [
  { value: 'no_valid_subject', label: 'No valid subject' },
  { value: 'too_poor_quality', label: 'Too poor quality' }
];

const deletionReasonCopy: Record<DeletionReason, string> = {
  no_valid_subject: "This submission will be removed and its submission points won't be awarded.",
  too_poor_quality: 'This submission will be removed, but the submitter will keep their submission points.'
};

const DeleteObservationFields = z.object({
  reason: z.enum(deletionReasons, { required_error: 'Choose a reason for deleting this submission.' })
});

type DeleteObservationFields = z.infer<typeof DeleteObservationFields>;

const DeleteObservationForm: FC<ModalProps<DeleteObservationModalProps>> = props => {
  const observationId = props.props?.observationId;
  if (!observationId) throw new Error('observationId is required');

  const deleteObservation = useDeleteObservation();
  const methods = useForm<DeleteObservationFields>({
    resolver: zodResolver(DeleteObservationFields)
  });
  const reason = methods.watch('reason');

  const deleteSubmission = async (data: DeleteObservationFields) => {
    await deleteObservation.mutateAsync({ observationId, reason: data.reason });
    props.close();
  };

  return (
    <Form className="flex flex-col gap-4" methods={methods} onSubmit={deleteSubmission}>
      <div>
        <h1 className="text-2xl font-bold text-accent-900">Delete submission?</h1>
        <p className="text-accent-900">
          The submission will be removed from review. Feedback on it will be deleted and those feedback points will be
          revoked.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="delete-observation-reason" className="text-sm font-bold text-accent-900">
          Reason
        </label>
        <Field name="reason">
          <SelectField id="delete-observation-reason" options={deletionReasonOptions} placeholder="Choose a reason" />
          <FieldError />
        </Field>
      </div>
      {reason && (
        <p className="rounded-md border border-accent-300 bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-900">
          {deletionReasonCopy[reason]}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={props.close}>Cancel</Button>
        <Button variant="danger" loading={deleteObservation.isPending} type="submit">
          Delete
        </Button>
      </div>
    </Form>
  );
};

export const DeleteObservationModal: FC<ModalProps<DeleteObservationModalProps>> = props => {
  return (
    <Modal className="bg-accent-100" {...props}>
      <DeleteObservationForm {...props} />
    </Modal>
  );
};
