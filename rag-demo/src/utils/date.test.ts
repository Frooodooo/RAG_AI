import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { formatRelativeTime } from './date.ts';

describe('formatRelativeTime', () => {
    let originalDateNow: () => number;
    const MOCKED_NOW = 1700000000000; // Fixed timestamp: 2023-11-14T22:13:20.000Z

    before(() => {
        originalDateNow = Date.now;
        Date.now = () => MOCKED_NOW;
    });

    after(() => {
        Date.now = originalDateNow;
    });

    test('returns "Just now" for less than 1 minute ago', () => {
        const iso = new Date(MOCKED_NOW - 30 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), 'Just now');
    });

    test('returns "Just now" for exactly now', () => {
        const iso = new Date(MOCKED_NOW).toISOString();
        assert.strictEqual(formatRelativeTime(iso), 'Just now');
    });

    test('returns "1m ago" for 1 minute ago', () => {
        const iso = new Date(MOCKED_NOW - 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '1m ago');
    });

    test('returns minutes ago for < 60 mins', () => {
        const iso = new Date(MOCKED_NOW - 10 * 60 * 1000).toISOString(); // 10 mins ago
        assert.strictEqual(formatRelativeTime(iso), '10m ago');
    });

    test('returns "59m ago" for 59 minutes ago', () => {
        const iso = new Date(MOCKED_NOW - 59 * 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '59m ago');
    });

    test('returns "1h ago" for 60 minutes ago', () => {
        const iso = new Date(MOCKED_NOW - 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '1h ago');
    });

    test('returns hours ago for < 24 hours', () => {
        const iso = new Date(MOCKED_NOW - 5 * 60 * 60 * 1000).toISOString(); // 5 hours ago
        assert.strictEqual(formatRelativeTime(iso), '5h ago');
    });

    test('returns "23h ago" for 23 hours ago', () => {
        const iso = new Date(MOCKED_NOW - 23 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '23h ago');
    });

    test('returns "1d ago" for 24 hours ago', () => {
        const iso = new Date(MOCKED_NOW - 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '1d ago');
    });

    test('returns days ago for < 7 days', () => {
        const iso = new Date(MOCKED_NOW - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
        assert.strictEqual(formatRelativeTime(iso), '3d ago');
    });

    test('returns "6d ago" for 6 days ago', () => {
        const iso = new Date(MOCKED_NOW - 6 * 24 * 60 * 60 * 1000).toISOString();
        assert.strictEqual(formatRelativeTime(iso), '6d ago');
    });

    test('returns formatted date for >= 7 days', () => {
        const iso = new Date(MOCKED_NOW - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
        const result = formatRelativeTime(iso);
        // We verify that it does NOT contain 'ago' or 'Just now'
        assert.strictEqual(result.includes('ago'), false);
        assert.strictEqual(result.includes('Just now'), false);
    });

    test('returns formatted date for much older date', () => {
        const iso = new Date(MOCKED_NOW - 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ago
        const result = formatRelativeTime(iso);
        assert.strictEqual(result.includes('ago'), false);
        assert.strictEqual(result.includes('Just now'), false);
    });
});
