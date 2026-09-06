import { describe, it, expect } from 'vitest';
import { cn } from '../../../frontend/src/lib/utils';

describe('cn (class-name merge helper)', () => {
  it('joins plain class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('drops falsy values from conditional expressions', () => {
    const active = false;
    expect(cn('btn', active && 'btn-active', undefined, null)).toBe('btn');
  });

  it('lets a later Tailwind utility win over an earlier conflicting one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm text-red-500', 'text-lg')).toBe('text-red-500 text-lg');
  });

  it('accepts arrays and objects like clsx does', () => {
    expect(cn(['flex', 'gap-2'], { 'text-red-500': false, 'font-bold': true })).toBe(
      'flex gap-2 font-bold',
    );
  });

  it('returns an empty string for no meaningful input', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });
});
