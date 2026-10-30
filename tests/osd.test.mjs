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

test('chart shows the latest value and dashed extension without inventing samples', () => {
  const chart = throughputSparkline([
    { time: 1000, rate: 1000000 },
    { time: 32000, rate: 2000000 },
    { time: 33000, rate: 3000000 }
  ], 34000);
  assert.equal(chart.max, 3000000);
  assert.equal(chart.current, 3000000);
  assert.equal(chart.age, 1000);
  assert.ok(chart.line.startsWith('M '));
  assert.ok(chart.area.endsWith(' Z'));
  assert.match(chart.continuation, / L 300 /);
  assert.ok(!chart.line.includes('300.0 64.0'));
});

test('chart expires after 30 seconds without fragments', () => {
  const empty = { line: '', area: '', continuation: '', max: 0, current: null, age: null };
  assert.deepEqual(throughputSparkline([], 30000), empty);
  assert.deepEqual(throughputSparkline([{ time: 1000, rate: 2000000 }], 31001), empty);
  const old = throughputSparkline([{ time: 1000, rate: 2000000 }], 31000);
  assert.equal(old.current, 2000000);
  assert.ok(old.continuation);
  assert.equal(old.age, 30000);
});

test('the chart does not extend beyond a sample captured just now', () => {
  const chart = throughputSparkline([{ time: 45000, rate: 5200000 }], 45000);
  assert.equal(chart.current, 5200000);
  assert.equal(chart.continuation, '');
  assert.ok(chart.line);
});

test('curve enters the left border continuously as observations age out', () => {
  const samples = [
    { time: 10000, rate: 1000000 },
    { time: 20000, rate: 3000000 },
    { time: 30000, rate: 2000000 },
    { time: 40000, rate: 4000000 }
  ];
  for (const now of [45000, 50001, 60001]) {
    const chart = throughputSparkline(samples, now);
    if (now === 60001) {
      assert.equal(chart.current, 4000000);
      assert.ok(chart.line.startsWith('M 0.0 '));
    } else {
      assert.ok(chart.line.startsWith('M 0.0 '));
    }
    assert.ok(chart.continuation);
  }
});

test('historical line uses a fine rendering mesh but stops at the last real sample', () => {
  const chart = throughputSparkline([
    { time: 10000, rate: 2000000 },
    { time: 20000, rate: 6000000 },
    { time: 30000, rate: 3000000 }
  ], 35000);
  const positions = [...chart.line.matchAll(/(?:M|L) ([0-9]+[.][0-9]+) ([0-9]+[.][0-9]+)/g)];
  assert.ok(positions.length > 25, 'interpolation should render more than one vertex per fragment');
  const lastX = Number(positions[positions.length - 1][1]);
  assert.equal(lastX, 250);
  assert.equal(chart.current, 3000000);
  assert.ok(chart.continuation.endsWith(' L 300 ' + positions[positions.length - 1][2]));
});

test('single real observation expires without becoming a synthetic plateau', () => {
  const sample = { time: 30000, rate: 1700000 };
  assert.equal(throughputSparkline([sample], 59000).current, 1700000);
  assert.equal(throughputSparkline([sample], 60001).current, null);
});
