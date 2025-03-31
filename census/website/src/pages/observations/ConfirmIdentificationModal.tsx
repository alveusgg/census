import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useConfirmIdentification } from '@/services/api/identifications';
import { Identification } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface ConfirmIdentificationModalProps {
  identification: Identification;
}

const ConfirmIdentificationFields = z.object({
  comment: z.string()
});

type ConfirmIdentificationFields = z.infer<typeof ConfirmIdentificationFields>;

const ConfirmIdentificationForm: FC<ModalProps<ConfirmIdentificationModalProps>> = props => {
  const identification = props.props?.identification;
  if (!identification) throw new Error('identification is required');

  const methods = useForm<ConfirmIdentificationFields>({
    resolver: zodResolver(ConfirmIdentificationFields)
  });

  const confirmIdentification = useConfirmIdentification();

  const submitFeedback = async (data: ConfirmIdentificationFields) => {
    await confirmIdentification.mutateAsync({ id: identification.id, comment: data.comment });
    props.close();
  };

  return (
    <Form className="flex flex-col gap-3" methods={methods} onSubmit={submitFeedback}>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold flex justify-between items-center gap-1">
          <span>Confirm identification for {identification.name}</span>
        </h1>
      </div>
      <Field name="comment">
        <TextAreaField placeholder="please explain your reasoning" />
      </Field>
      <Button loading={confirmIdentification.isPending} type="submit">
        Confirm
      </Button>
    </Form>
  );
};

export const ConfirmIdentificationModal: FC<ModalProps<ConfirmIdentificationModalProps>> = props => {
  return (
    <Modal
      className="bg-accent-100 text-accent-900 ring-4 ring-accent-300 ring-inset rounded-lg px-8 py-6 w-full max-w-2xl"
      {...props}
    >
      <ConfirmIdentificationForm {...props} />
    </Modal>
  );
};
