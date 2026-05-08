import { describe, it, expect, vi } from 'vitest';
import { signal, effect } from './signal';

describe('signal', () => {
  it('returns the initial value when read', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates the value via set()', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('runs an effect once on creation', () => {
    const fn = vi.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs effects when a tracked signal changes', async () => {
    const count = signal(0);
    const fn = vi.fn(() => { count(); });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    count.set(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not re-run effects that did not read the signal', async () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn(() => { a(); });
    effect(fn);
    b.set(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not notify when set() writes the same value', async () => {
    const count = signal(0);
    const fn = vi.fn(() => { count(); });
    effect(fn);
    count.set(0);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
