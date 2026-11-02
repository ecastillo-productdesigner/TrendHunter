// Call synchronously from a user gesture; the device owns the menu and its targets.
export async function shareWithSystem(data, platform = navigator) {
  try {
    if (typeof platform.share !== 'function') return 'unavailable';
    if (typeof platform.canShare === 'function' && !platform.canShare(data)) return 'unavailable';
    await platform.share(data);
    return 'shared';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
}
