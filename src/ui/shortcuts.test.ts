import { describe, it, expect } from 'vitest';
import { shouldIgnore } from './shortcuts';

describe('shouldIgnore', () => {
  it('ignores events inside inputs', () => {
    expect(shouldIgnore(document.createElement('input'))).toBe(true);
  });
  it('ignores contenteditable', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    expect(shouldIgnore(div)).toBe(true);
  });
  it('does not ignore plain buttons', () => {
    expect(shouldIgnore(document.createElement('button'))).toBe(false);
  });
});
