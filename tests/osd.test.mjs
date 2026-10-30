import test from 'node:test';
import assert from 'node:assert/strict';
import { bufferedAhead, formatRate, formatDownloaded, fragmentTransferSample, throughputSparkline } from '../extension/player/osd.mjs';

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

test('fragment download rate uses hls.js fragment statistics', () => {
  const data = { frag: { stats: { loaded: 250000, loading: { start: 100, end: 600 } } } };
  assert.deepEqual(fragmentTransferSample(data, 1234), { time: 1234, bytes: 250000, rate: 4000000 });
  assert.equal(formatDownloaded(250000), '0.25 MB');
});

test('low-latency part stats take priority over fragment stats', () => {
  const data = {
    frag: { stats: { loaded: 100000, loading: { start: 0, end: 1000 } } },
    part: { stats: { loaded: 50000, loading: { start: 0, end: 100 } } }
  };
  assert.equal(fragmentTransferSample(data, 42).rate, 4000000);
});

test('download rate supports event stats and payload size fallback', () => {
  const data = { stats: { loading: { start: 10, end: 210 } }, payload: { byteLength: 100000 } };
  assert.equal(fragmentTransferSample(data, 400).rate, 4000000);
  assert.equal(fragmentTransferSample({ frag: { stats: { loaded: 1 } } }, 0), null);
});

test('chart excludes stale samples and does not invent data', () => {
  assert.deepEqual(throughputSparkline([], 30000), { line: '', area: '', max: 0 });
  const chart = throughputSparkline([
    { time: 1000, rate: 1000000 },
    { time: 32000, rate: 2000000 },
    { time: 33000, rate: 3000000 }
  ], 34000);
  assert.equal(chart.max, 3000000);
  assert.ok(chart.line.startsWith('M '));
  assert.ok(chart.area.endsWith(' Z'));
});
