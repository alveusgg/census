import { SyntheticEvent } from 'react';

// Start of Selection
const adjectives = [
  'adorable',
  'charming',
  'delightful',
  'friendly',
  'gentle',
  'happy',
  'joyful',
  'kind',
  'lovely',
  'playful',
  'sweet',
  'cheerful',
  'pleasant',
  'bright',
  'lively',
  'graceful',
  'whimsical',
  'curious',
  'bubbly',
  'cute'
];

const nouns = [
  'critter',
  'creature',
  'insect',
  'bug',
  'beastie',
  'lifeform',
  'organism',
  'being',
  'specimen',
  'entity',
  'scuttler',
  'nibbler'
];

export const makeNickname = () => {
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

export const generatePlaceholderNickname = (existing: string[]) => {
  let nickname: string;
  do {
    nickname = makeNickname();
  } while (existing.includes(nickname));
  return nickname;
};

const colors = ['#5383E3', '#CB5DE7', '#E15D5D', '#E79446', '#9FB035', '#37AD6D', '#39A0B6'];
export const getColorForId = (id: number) => {
  return colors[id % colors.length];
};

/*
cursor-editor-#5383E3
cursor-editor-#CB5DE7
cursor-editor-#E15D5D
cursor-editor-#E79446
cursor-editor-#9FB035
cursor-editor-#37AD6D
cursor-editor-#39A0B6
*/

export const snapTimeHandler = (event: SyntheticEvent<HTMLVideoElement>) => {
  const video = event.currentTarget;
  const frameDuration = 1 / 30;

  const bottomOfFrame = Math.floor(video.currentTime / frameDuration) * frameDuration;
  const targetTime = bottomOfFrame + frameDuration / 2;
  const difference = Math.abs(video.currentTime - targetTime);
  if (difference <= 0.01) {
    return;
  }
  video.currentTime = targetTime;
};
