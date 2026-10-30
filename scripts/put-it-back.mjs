// DISABLED by Claude, 2026-10-01.
//
// This used to copy spine/V1.11 over the live engine every time the watchdog
// restarted the desk. That silently undid every fix made after V1.11, which is
// why the desk would trade right for a while and then go wrong again after a
// restart. A restart now restarts the same code that was running.
//
// Do not re-enable. Do not restore any spine folder over src/ unless Love asks
// for that specific restore in the current conversation.
console.log(JSON.stringify({ restored: 0, disabled: true, at: new Date().toISOString() }));
