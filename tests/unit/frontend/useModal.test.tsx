import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useModal } from '../../../frontend/src/hooks/useModal';

describe('useModal', () => {
  it('is closed by default', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('honours an explicit initial state', () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('openModal / closeModal set the flag', () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.closeModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('toggleModal flips the flag each call', () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.toggleModal());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggleModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('keeps stable callback identities across renders', () => {
    const { result, rerender } = renderHook(() => useModal());
    const first = result.current.openModal;
    rerender();
    expect(result.current.openModal).toBe(first);
  });
});
