import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../../frontend/src/store/useAppStore';

// The store is a module singleton — snapshot the pristine state and restore it
// before every test so cases don't leak into each other.
const pristine = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(pristine, true);
});

describe('useAppStore — auth slice', () => {
  it('setUser stores the user object', () => {
    const user = { id: 'u1', name: 'Nimal', role: 'ADMIN' as const };
    useAppStore.getState().setUser(user);
    expect(useAppStore.getState().user).toEqual(user);
  });

  it('setAuthenticated toggles the flag', () => {
    useAppStore.getState().setAuthenticated(true);
    expect(useAppStore.getState().isAuthenticated).toBe(true);
  });
});

describe('useAppStore — notifications slice', () => {
  it('addNotification prepends (newest first)', () => {
    const { addNotification } = useAppStore.getState();
    addNotification({ id: 'a', unread: true });
    addNotification({ id: 'b', unread: true });
    expect(useAppStore.getState().notifications.map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('markAsRead flips only the matching notification', () => {
    const s = useAppStore.getState();
    s.setNotifications([
      { id: 'a', unread: true, read: false },
      { id: 'b', unread: true, read: false },
    ]);
    s.markAsRead('a');
    const byId = Object.fromEntries(
      useAppStore.getState().notifications.map((n) => [n.id, n]),
    );
    expect(byId.a).toMatchObject({ unread: false, read: true });
    expect(byId.b).toMatchObject({ unread: true, read: false });
  });

  it('clearNotifications empties the list', () => {
    const s = useAppStore.getState();
    s.setNotifications([{ id: 'a' }, { id: 'b' }]);
    s.clearNotifications();
    expect(useAppStore.getState().notifications).toEqual([]);
  });
});

describe('useAppStore — misc slices', () => {
  it('setSearchQuery and setActiveIncidentId round-trip', () => {
    useAppStore.getState().setSearchQuery('flood colombo');
    useAppStore.getState().setActiveIncidentId('inc-9');
    expect(useAppStore.getState().searchQuery).toBe('flood colombo');
    expect(useAppStore.getState().activeIncidentId).toBe('inc-9');
  });

  it('setIncidents replaces the array', () => {
    useAppStore.getState().setIncidents([{ id: 'x' }]);
    expect(useAppStore.getState().incidents).toHaveLength(1);
  });
});
