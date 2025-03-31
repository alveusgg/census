import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { FC } from 'react';

export const LevelUpModal: FC<ModalProps<{ level: number }>> = props => {
  return (
    <Modal {...props} className="bg-[#B068F8] p-6 flex justify-center items-center">
      <h1 className="text-white text-2xl font-bold">Level up!</h1>
      <p className="text-white text-lg">You've reached level {props.props?.level}!</p>
    </Modal>
  );
};
