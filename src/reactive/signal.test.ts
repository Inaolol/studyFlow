import { describe, it, expect, vi } from 'vitest';
import { signal, effect, computed } from './signal';

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

describe('batching', () => {
  it('coalesces multiple writes in the same tick into one effect run', async () => {
    const a = signal(0);
    const fn = vi.fn(() => { a(); });
    effect(fn);
    a.set(1);
    a.set(2);
    a.set(3);
    expect(fn).toHaveBeenCalledTimes(1); // not yet flushed
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2); // initial + one batched
  });
});

describe('computed', () => {
  it('returns the derived value', () => {
    const n = signal(2);
    const doubled = computed(() => n() * 2);
    expect(doubled()).toBe(4);
  });

  it('recomputes after a dependency changes', async () => {
    const n = signal(2);
    const doubled = computed(() => n() * 2);
    expect(doubled()).toBe(4);
    n.set(5);
    await Promise.resolve();
    expect(doubled()).toBe(10);
  });

  it('caches the result between dependency changes', () => {
    const n = signal(2);
    const compute = vi.fn(() => n() * 2);
    const doubled = computed(compute);
    doubled();
    doubled();
    doubled();
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
