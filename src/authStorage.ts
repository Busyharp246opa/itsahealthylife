type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const modeKey = 'healthy-life-auth-storage-mode';

export function createAuthStorage(local: KeyValueStorage, session: KeyValueStorage) {
  let active: KeyValueStorage = session.getItem(modeKey) === 'session' ? session : local;

  return {
    storage: {
      getItem: (key: string) => active.getItem(key),
      setItem: (key: string, value: string) => {
        active.setItem(key, value);
        (active === local ? session : local).removeItem(key);
      },
      removeItem: (key: string) => {
        local.removeItem(key);
        session.removeItem(key);
      },
    },
    rememberByDefault: () => local.getItem(modeKey) === 'local' && session.getItem(modeKey) !== 'session',
    choose: (remember: boolean) => {
      if (remember) {
        local.setItem(modeKey, 'local');
        session.removeItem(modeKey);
        active = local;
      } else {
        session.setItem(modeKey, 'session');
        local.removeItem(modeKey);
        active = session;
      }
    },
  };
}
