import assert from 'node:assert/strict';
import test from 'node:test';
import { getObservationVideoClips } from './videoClips';

const capture = {
  startCaptureAt: '2026-01-01T00:00:00.000Z',
  endCaptureAt: '2026-01-01T00:01:00.000Z',
  muxPlaybackId: 'playback-one'
};

test('pads the earliest and latest image timestamps by two seconds', () => {
  const clips = getObservationVideoClips([
    {
      capture,
      images: [{ timestamp: '12.5' }, { timestamp: '20' }, { timestamp: '16' }]
    }
  ]);

  assert.deepEqual(clips, [{ playbackId: 'playback-one', startTime: 10.5, endTime: 22 }]);
});

test('clamps trim bounds to the capture', () => {
  const clips = getObservationVideoClips([
    {
      capture,
      images: [{ timestamp: '1' }, { timestamp: '59.5' }]
    }
  ]);

  assert.deepEqual(clips, [{ playbackId: 'playback-one', startTime: 0, endTime: 60 }]);
});

test('creates separate trims for images from different playback assets', () => {
  const clips = getObservationVideoClips([
    { capture, images: [{ timestamp: '10' }] },
    {
      capture: { ...capture, muxPlaybackId: 'playback-two' },
      images: [{ timestamp: '30' }, { timestamp: '35' }]
    }
  ]);

  assert.deepEqual(clips, [
    { playbackId: 'playback-one', startTime: 8, endTime: 12 },
    { playbackId: 'playback-two', startTime: 28, endTime: 37 }
  ]);
});
