export const AUTH_STATE_CHANGED_EVENT = 'venflete:auth-state-changed'

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
  }
}
