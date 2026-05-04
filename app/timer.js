// Forgiving timer. No streaks, no shame; if it stops, it stops.

export function createTimer({ onTick, onDone }) {
    let endAt = null;
    let intervalId = null;

    function tick() {
        if (endAt === null) return;
        const remaining = endAt - Date.now();
        if (remaining <= 0) {
            stop();
            onTick?.(0);
            onDone?.();
            return;
        }
        onTick?.(remaining);
    }

    function start(durationMs) {
        stop();
        endAt = Date.now() + durationMs;
        onTick?.(durationMs);
        intervalId = setInterval(tick, 250);
    }

    function stop() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        endAt = null;
    }

    return { start, stop };
}
