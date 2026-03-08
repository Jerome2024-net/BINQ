/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API (Android Chrome/Firefox/Edge/Samsung Internet)
 * and AudioContext for a subtle tactile-like effect on iOS.
 * Always fails silently if unsupported.
 */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Light tap — button press, tab switch, toggle */
export function hapticLight() {
  try {
    if (canVibrate()) navigator.vibrate(10);
  } catch { /* silent */ }
}

/** Medium tap — confirm action, copy, share */
export function hapticMedium() {
  try {
    if (canVibrate()) navigator.vibrate(25);
  } catch { /* silent */ }
}

/** Success — payment sent, QR scanned, action completed */
export function hapticSuccess() {
  try {
    if (canVibrate()) navigator.vibrate([30, 50, 30]);
  } catch { /* silent */ }
}

/** Error — failed action, invalid QR */
export function hapticError() {
  try {
    if (canVibrate()) navigator.vibrate([50, 30, 50, 30, 80]);
  } catch { /* silent */ }
}

/** Strong — payment received, important notification */
export function hapticHeavy() {
  try {
    if (canVibrate()) navigator.vibrate([40, 30, 60]);
  } catch { /* silent */ }
}

/** Warning — destructive action confirmation, low balance */
export function hapticWarning() {
  try {
    if (canVibrate()) navigator.vibrate([30, 20, 60]);
  } catch { /* silent */ }
}
