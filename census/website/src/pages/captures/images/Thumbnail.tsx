import { usePreload } from '@/lib/preload';
import { cn } from '@/utils/cn';
import { useVariable } from '@alveusgg/backstage';
import { motion } from 'framer-motion';
import { FC } from 'react';

export const Thumbnail: FC<{
  url: string;
  selected: boolean;
  onClick: () => void;
  kept?: boolean;
  discarded?: boolean;
}> = ({ url, selected, onClick, kept, discarded }) => {
  const imageResizeCDNUrl = useVariable('imageResizeCDNUrl');
  usePreload(`${imageResizeCDNUrl}/quality=60,width=100/${url}`);

  return (
    <div className="relative h-28 flex items-center">
      <motion.button
        key={url}
        type="button"
        onClick={onClick}
        initial={{
          x: '100%',
          opacity: 0
        }}
        animate={{
          x: 0,
          opacity: 1,
          height: selected ? '5rem' : '3.5rem',
          width: selected ? '5rem' : '3.5rem'
        }}
        style={{
          borderWidth: '3px',
          backgroundImage: `url(${imageResizeCDNUrl}/quality=60,width=100/${url})`
        }}
        className={cn('aspect-square bg-center bg-cover rounded-lg bg-accent-300 relative border-white z-10')}
      >
        {kept && (
          <motion.svg
            initial={{
              right: 3,
              top: -3,
              opacity: 0
            }}
            animate={{
              right: 3,
              top: -8,
              opacity: 1
            }}
            className="absolute"
            width="24"
            viewBox="0 0 37 51"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 1.5H31C33.4853 1.5 35.5 3.51472 35.5 6V40.4029C35.5 43.9007 31.6841 46.0612 28.6848 44.2616L22.3587 40.4659C19.9836 39.0409 17.0164 39.0409 14.6413 40.4659L8.31523 44.2616C5.31587 46.0612 1.5 43.9007 1.5 40.4029V6C1.5 3.51472 3.51472 1.5 6 1.5Z"
              fill="#B068F8"
              stroke="white"
              strokeWidth="3"
            />
            <path
              d="M17.5489 13.9271C17.8483 13.0058 19.1517 13.0058 19.451 13.9271L20.6329 17.5644C20.7667 17.9764 21.1507 18.2553 21.5839 18.2553H25.4084C26.3771 18.2553 26.7799 19.495 25.9962 20.0644L22.9021 22.3123C22.5516 22.567 22.405 23.0183 22.5388 23.4304L23.7207 27.0676C24.02 27.989 22.9655 28.7551 22.1818 28.1857L19.0878 25.9377C18.7373 25.6831 18.2627 25.6831 17.9122 25.9377L14.8181 28.1857C14.0344 28.7551 12.9799 27.989 13.2793 27.0676L14.4611 23.4304C14.595 23.0183 14.4483 22.567 14.0979 22.3123L11.0038 20.0644C10.2201 19.495 10.6229 18.2553 11.5916 18.2553H15.416C15.8493 18.2553 16.2332 17.9764 16.3671 17.5644L17.5489 13.9271Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.5979 13.6181C17.1966 11.7754 19.8034 11.7754 20.4021 13.618L21.584 17.2553L25.4084 17.2553C27.3459 17.2553 28.1514 19.7346 26.584 20.8734L23.4899 23.1213L24.6718 26.7586C25.2705 28.6012 23.1615 30.1335 21.5941 28.9947L18.5 26.7467L15.406 28.9947C13.8385 30.1335 11.7296 28.6013 12.3283 26.7586L13.5101 23.1213L10.416 20.8734C8.84861 19.7346 9.65415 17.2553 11.5916 17.2553H15.4161L16.5979 13.6181ZM19.6818 17.8734L18.5 14.2361L17.3182 17.8734C17.0504 18.6974 16.2825 19.2553 15.4161 19.2553L11.5916 19.2553L14.6857 21.5033C15.3866 22.0126 15.68 22.9153 15.4122 23.7394L14.2304 27.3767L17.3244 25.1287C18.0254 24.6194 18.9746 24.6194 19.6756 25.1287L22.7696 27.3767L21.5878 23.7394C21.3201 22.9153 21.6134 22.0126 22.3144 21.5033L25.4084 19.2553H21.584C20.7175 19.2553 19.9496 18.6974 19.6818 17.8734Z"
              fill="white"
            />
          </motion.svg>
        )}

        {discarded && (
          <motion.svg
            initial={{
              right: 3,
              top: -3,
              opacity: 0
            }}
            animate={{
              right: 3,
              top: -8,
              opacity: 1
            }}
            className="absolute"
            width="24"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1.5" y="1.5" width="32" height="32" rx="5.5" fill="#F86868" stroke="white" strokeWidth="3" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M22.4048 12.629C22.9397 12.6756 23.3357 13.1469 23.2892 13.6818L22.5168 22.5639C22.5168 22.5639 22.5168 22.5639 22.5168 22.564C22.3906 24.0154 21.1755 25.1293 19.7187 25.1293H15.2813C13.8244 25.1293 12.6094 24.0154 12.4832 22.564L13.4517 22.4797L12.4832 22.564L11.7108 13.6818C11.6643 13.1469 12.0602 12.6756 12.5952 12.629C13.1301 12.5825 13.6014 12.9785 13.648 13.5134L14.4203 22.3955C14.4591 22.8421 14.833 23.1848 15.2813 23.1848H19.7187C20.167 23.1848 20.5408 22.8421 20.5796 22.3956L20.5796 22.3955L21.352 13.5134C21.3985 12.9785 21.8699 12.5825 22.4048 12.629Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.2705 11.8152C16.7932 11.8152 16.4063 12.2021 16.4063 12.6794V13.3681C16.4063 13.905 15.971 14.3403 15.434 14.3403C14.8971 14.3403 14.4618 13.905 14.4618 13.3681V12.6794C14.4618 11.1283 15.7192 9.87079 17.2705 9.87079H17.7296C19.2808 9.87079 20.5382 11.1283 20.5382 12.6794V13.3681C20.5382 13.905 20.1029 14.3403 19.566 14.3403C19.029 14.3403 18.5938 13.905 18.5938 13.3681V12.6794C18.5938 12.2021 18.2069 11.8152 17.7296 11.8152H17.2705Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.1003 13.5976C10.1003 13.0607 10.5356 12.6254 11.0726 12.6254H23.9275C24.4644 12.6254 24.8997 13.0607 24.8997 13.5976C24.8997 14.1346 24.4644 14.5699 23.9275 14.5699H11.0726C10.5356 14.5699 10.1003 14.1346 10.1003 13.5976Z"
              fill="white"
            />
          </motion.svg>
        )}
      </motion.button>
      {selected && (
        <motion.div
          layout
          layoutId="selected-thumbnail"
          className="absolute -left-4 bg-accent-300 rounded-3xl w-28 h-28"
        ></motion.div>
      )}
    </div>
  );
};
