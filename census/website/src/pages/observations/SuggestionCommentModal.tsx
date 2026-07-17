import { Button } from '@/components/controls/button/juicy';
import { Field } from '@/components/forms/Field';
import { Form } from '@/components/forms/Form';
import { TextAreaField } from '@/components/forms/inputs/TextAreaInput';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { useAddJustificationToIdentification } from '@/services/api/identifications';
import { Identification } from '@/services/api/observations';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export interface SuggestionCommentModalProps {
  identification: Identification;
}

const SuggestionCommentFields = z.object({
  comment: z.string().trim().min(1)
});

type SuggestionCommentFields = z.infer<typeof SuggestionCommentFields>;

const SuggestionCommentForm: FC<ModalProps<SuggestionCommentModalProps>> = props => {
  const identification = props.props?.identification;
  if (!identification) throw new Error('identification is required');

  const addComment = useAddJustificationToIdentification();
  const methods = useForm<SuggestionCommentFields>({
    resolver: zodResolver(SuggestionCommentFields),
    defaultValues: {
      comment: ''
    }
  });

  const submitComment = async (data: SuggestionCommentFields) => {
    await addComment.mutateAsync({ id: identification.id, comment: data.comment });
    props.close();
  };

  return (
    <Form className="flex flex-col gap-3" methods={methods} onSubmit={submitComment}>
      <div className="flex flex-col">
        <h1 className="flex items-center justify-between gap-1 text-2xl font-bold">
          <span>Add a comment for {identification.name}</span>
        </h1>
        <p className="leading-tight">
          Add a note to explain your suggestion. It will be shown with the feedback for this identification.
        </p>
      </div>
      <Field name="comment">
        <TextAreaField placeholder="please add your note" />
      </Field>
      <Button loading={addComment.isPending} type="submit" className="place-self-end">
        add comment
      </Button>
    </Form>
  );
};

export const SuggestionCommentModal: FC<ModalProps<SuggestionCommentModalProps>> = props => {
  return (
    <Modal
      title={`Add a comment for ${props.props?.identification.name ?? 'identification'}`}
      className="w-full max-w-2xl rounded-lg bg-accent-100 px-8 py-6 text-accent-900 ring-4 ring-inset ring-accent-300"
      {...props}
    >
      <SuggestionCommentForm {...props} />
    </Modal>
  );
};
