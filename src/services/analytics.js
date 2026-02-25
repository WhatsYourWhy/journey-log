(function (global) {
    const ANALYTICS_EVENTS = Object.freeze({
        TASK_ADDED: 'task_added',
        TASK_COMPLETED: 'task_completed',
        NOTE_USED: 'note_used',
        THEME_CHANGED: 'theme_changed',
        UNDO_USED: 'undo_used'
    });

    function sanitizeMetadata(eventName, metadata = {}) {
        if (!metadata || typeof metadata !== 'object') return {};

        if (eventName === ANALYTICS_EVENTS.TASK_ADDED) {
            return {
                hasMood: Boolean(metadata.hasMood),
                hasCategory: Boolean(metadata.hasCategory),
                hasPriority: Boolean(metadata.hasPriority)
            };
        }

        if (eventName === ANALYTICS_EVENTS.TASK_COMPLETED) {
            return {
                completed: Boolean(metadata.completed)
            };
        }

        if (eventName === ANALYTICS_EVENTS.NOTE_USED) {
            return {
                action: metadata.action === 'cleared' ? 'cleared' : 'added'
            };
        }

        if (eventName === ANALYTICS_EVENTS.THEME_CHANGED) {
            return {
                theme: typeof metadata.theme === 'string' ? metadata.theme : 'unknown'
            };
        }

        if (eventName === ANALYTICS_EVENTS.UNDO_USED) {
            return {
                restoredCount: Number.isFinite(Number(metadata.restoredCount)) ? Number(metadata.restoredCount) : 0
            };
        }

        return {};
    }

    function createLocalAggregateStore(storage, options = {}) {
        const storageKey = options.storageKey || 'journeyAnalyticsAggregate';

        function readSnapshot() {
            try {
                const raw = storage.getItem(storageKey);
                if (!raw) return { total: 0, events: {} };
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    return { total: 0, events: {} };
                }
                const events = parsed.events && typeof parsed.events === 'object' && !Array.isArray(parsed.events)
                    ? parsed.events
                    : {};
                return {
                    total: Number(parsed.total) || 0,
                    events
                };
            } catch (error) {
                console.warn('Analytics aggregate could not be read from storage.', error);
                return { total: 0, events: {} };
            }
        }

        function writeSnapshot(snapshot) {
            try {
                storage.setItem(storageKey, JSON.stringify(snapshot));
                return true;
            } catch (error) {
                console.warn('Analytics aggregate could not be saved to storage.', error);
                return false;
            }
        }

        function increment(eventName, metadata = {}) {
            const snapshot = readSnapshot();
            const eventBucket = snapshot.events[eventName] || { count: 0, variants: {} };
            eventBucket.count += 1;
            const variantKey = JSON.stringify(metadata);
            eventBucket.variants[variantKey] = (eventBucket.variants[variantKey] || 0) + 1;
            snapshot.events[eventName] = eventBucket;
            snapshot.total += 1;
            writeSnapshot(snapshot);
            return snapshot;
        }

        function clear() {
            writeSnapshot({ total: 0, events: {} });
        }

        return {
            readSnapshot,
            increment,
            clear
        };
    }

    function createEventDispatcher(options = {}) {
        const isEnabled = options.isEnabled ?? (() => false);
        const aggregateStore = options.aggregateStore;
        const externalSink = options.externalSink ?? null;

        function dispatch(eventName, metadata = {}) {
            if (!Object.values(ANALYTICS_EVENTS).includes(eventName)) {
                return false;
            }
            if (!isEnabled()) {
                return false;
            }

            const safeMetadata = sanitizeMetadata(eventName, metadata);
            aggregateStore?.increment(eventName, safeMetadata);

            if (typeof externalSink === 'function') {
                externalSink({
                    event: eventName,
                    timestamp: new Date().toISOString(),
                    metadata: safeMetadata
                });
            }

            return true;
        }

        return {
            dispatch
        };
    }

    const api = {
        ANALYTICS_EVENTS,
        sanitizeMetadata,
        createLocalAggregateStore,
        createEventDispatcher
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogAnalytics = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
