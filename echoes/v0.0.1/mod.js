export const echo = (initialValue) => {
  let value = null;
  const listeners = new Set();

  if (typeof initialValue !== "undefined") value = initialValue;

  return {
    get value() {
      return value;
    },
    next(data) {
      typeof data === "function" ? data(value) : (value = data);

      listeners.forEach(({ until }) => until && until());
      listeners.forEach(({ cb }) => cb(value));
    },
    listen(cb, options = { lazy: false }) {
      const listener = { cb };
      listeners.add(listener);
      if (!options.lazy) cb(value);

      const subscription = {
        mute: () => listeners.delete(listener),
        until: (condition) => {
          listener.until = () =>
            condition(value) ? subscription.mute() : null;
        },
        trigger: (message) => cb(message),
      };

      return subscription;
    },
  };
};

export const computed = (cb, dependencies) => {
  const _dependencies = new Set(dependencies);
  const internalEcho = echo(cb());

  _dependencies.forEach((dep) => {
    dep.listen(() => internalEcho.next(cb()));
  });

  return {
    get value() {
      return internalEcho.value;
    },
    listen: internalEcho.listen,
  };
};
