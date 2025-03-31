import { Square } from '@/components/assets/images/Square';
import { Note } from '@/components/containers/Note';
import { Link } from '@/components/controls/button/paper';
import SiLink from '@/components/icons/SiLink';
import { Loader } from '@/components/loaders/Loader';
import { Modal } from '@/components/modal/Modal';
import { ModalProps } from '@/components/modal/useModal';
import { Timestamp } from '@/components/text/Timestamp';
import { useIdentification } from '@/services/api/identifications';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { motion } from 'framer-motion';
import { FC, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Controls } from '../observations/gallery/Controls';
import { Slide } from '../observations/gallery/GalleryProvider';
import { Polaroid } from '../observations/gallery/Polaroid';
import { Preloader } from '../observations/Observations';
import { EncryptedImg } from './Shiny';

export interface IdentificationProps {
  identificationId: number;
}

const Identification: FC<IdentificationProps> = ({ identificationId }) => {
  const query = useIdentification(identificationId);
  const identification = useSuspenseQuery(query);

  if (!identification.data?.observation) throw new Error('Observation not found');

  return (
    <div className="@container w-full">
      <div className="flex gap-4 flex-col @lg:flex-row">
        <Polaroid>
          <Preloader>
            {identification.data.observation.images.map(image => (
              <Square key={image.id} src={image.url} options={{ extract: image.boundingBox }} />
            ))}
          </Preloader>
          {identification.data.shiny && (
            <Slide id="shiny">
              <div className="bg-accent-100 absolute inset-2 rounded-sm">
                <motion.div initial={{ scale: 1.1, rotate: '-1deg' }} animate={{ scale: 1.15, rotate: '1deg' }}>
                  <EncryptedImg
                    src={`/images/${identification.data.shiny.assetId}.encrypted.png`}
                    iv={identification.data.shiny.key}
                    className="drop-shadow-xl origin-center"
                  />
                </motion.div>
                <p className="text-accent-900 inset-x-0 absolute top-3 px-4 flex justify-between items-center">
                  <h4 className="font-bold text-lg flex-1">Dr. Allison's Shiny Bugs</h4>
                  <p className="font-bold text-sm">@catonascreen</p>
                </p>
              </div>
            </Slide>
          )}
          {identification.data.observation.images.map(image => (
            <Slide key={image.id} id={image.id.toString()}>
              <div className="w-full h-full overflow-clip relative">
                <Square
                  loading="lazy"
                  className="absolute inset-0 w-full h-full z-10"
                  src={image.url}
                  options={{ extract: image.boundingBox }}
                />
                <Square
                  className="absolute inset-0 w-full h-full blur-2xl"
                  src={image.url}
                  options={{ extract: image.boundingBox, width: 25, height: 25 }}
                />
              </div>
            </Slide>
          ))}
          <Controls />
        </Polaroid>
        <Note className="w-full h-fit">
          <div className="pb-2 pt-4 px-4 flex gap-6 justify-between items-center">
            <div className="font-mono mb-1 leading-tight">
              <p className="text-lg font-semibold">{identification.data.nickname}</p>
              <Timestamp date={identification.data.observation.observedAt}>
                <p className="text-sm">
                  {formatInTimeZone(identification.data.observation.observedAt, 'America/Chicago', 'MM/dd/yyyy hh:mma')}
                </p>
              </Timestamp>
            </div>
            <Link compact to={`https://www.inaturalist.org/observations/${identification.data.observation.id}`}>
              <SiLink className="text-lg" />
              iNat
            </Link>
          </div>
        </Note>
      </div>
    </div>
  );
};

export const IdentificationModal: FC<ModalProps<IdentificationProps>> = props => {
  return (
    <Modal {...props} className="w-full max-w-4xl bg-accent-200 p-8">
      <Suspense fallback={<Loader className="m-24 text-accent-900 w-6 h-6 mx-auto" />}>
        {props.props?.identificationId && <Identification identificationId={props.props.identificationId} />}
      </Suspense>
    </Modal>
  );
};

export const IdentificationPage: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goToAllIdentifications = () => navigate('/identifications');

  return (
    <IdentificationModal
      props={{ identificationId: Number(id) }}
      isOpen={true}
      open={goToAllIdentifications}
      close={goToAllIdentifications}
      toggle={goToAllIdentifications}
    />
  );
};
