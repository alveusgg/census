import { FC, PropsWithChildren, useState } from 'react';
import { Button } from '../controls/button/juicy';
import { Modal } from './Modal';
import { ModalProps, useModal } from './useModal';

interface ConfirmModalProps {
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
}

export const useConfirm = () => {
  return useModal<ConfirmModalProps>();
};

export const Confirm: FC<PropsWithChildren<ModalProps<ConfirmModalProps>>> = ({ children, ...props }) => {
  const [loading, setLoading] = useState(false);
  const confirm = async () => {
    if (!props.props) throw new Error('props are required');
    if (!props.props.onConfirm) throw new Error('onConfirm is required');
    setLoading(true);
    await props.props.onConfirm();
    setLoading(false);
    props.close();
  };

  return (
    <Modal className="bg-accent-100" {...props}>
      <div>
        <h1 className="text-2xl font-bold text-accent-900">{props.props?.title}</h1>
        <p className="text-accent-900">{props.props?.description}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={props.close}>Cancel</Button>
        <Button variant="danger" onClick={confirm} loading={loading}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};
