type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

let unauthorizedNotified = false;

export function addUnauthorizedListener(
  listener: UnauthorizedListener
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyUnauthorized() {
  if (unauthorizedNotified) {
    return;
  }

  unauthorizedNotified = true;

  listeners.forEach((listener) => {
    listener();
  });
}

export function resetUnauthorizedState() {
  unauthorizedNotified = false;
}