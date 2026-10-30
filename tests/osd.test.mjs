import test from 'node:test';
import assert from 'node:assert/strict';
import { bufferedAhead, formatRate } from '../extension/player/osd.mjs';

test('buffer ahead uses the buffered range containing the playhead', () => {
  const video = { currentTime: 12, buffered: { length: 2, start: i => [0, 10][i], end: i => [5, 19][i] } };
  assert.equal(bufferedAhead(video), 7);
  video.currentTime = 8;
  assert.equal(bufferedAhead(video), 0);
});

test('throughput does not invent unavailable values', () => {
  assert.equal(formatRate(undefined), '—');
  assert.equal(formatRate(0), '—');
  assert.equal(formatRate(4800000), '4.80 Mbps');
});
