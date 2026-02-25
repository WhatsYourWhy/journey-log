const { test, expect } = require('@playwright/test');
const {
    ANALYTICS_EVENTS,
    sanitizeMetadata,
    createLocalAggregateStore,
    createEventDispatcher
} = require('../src/services/analytics');

function createMemoryStorage() {
    const map = new Map();
    return {
        getItem(key) {
            return map.has(key) ? map.get(key) : null;
        },
        setItem(key, value) {
            map.set(key, String(value));
        },
        removeItem(key) {
            map.delete(key);
        }
    };
}

test.describe('analytics module', () => {
    test('sanitizes metadata and strips unexpected fields', () => {
        const sanitized = sanitizeMetadata(ANALYTICS_EVENTS.TASK_ADDED, {
            hasMood: 1,
            hasCategory: 'yes',
            hasPriority: true,
            description: 'this should never pass through'
        });

        expect(sanitized).toEqual({
            hasMood: true,
            hasCategory: true,
            hasPriority: true
        });
    });

    test('dispatcher no-ops when analytics is disabled', () => {
        const store = createLocalAggregateStore(createMemoryStorage());
        const dispatcher = createEventDispatcher({
            isEnabled: () => false,
            aggregateStore: store
        });

        const dispatched = dispatcher.dispatch(ANALYTICS_EVENTS.TASK_COMPLETED, { completed: true });

        expect(dispatched).toBe(false);
        expect(store.readSnapshot().total).toBe(0);
    });

    test('dispatcher aggregates counters locally when enabled', () => {
        const store = createLocalAggregateStore(createMemoryStorage());
        const dispatcher = createEventDispatcher({
            isEnabled: () => true,
            aggregateStore: store
        });

        dispatcher.dispatch(ANALYTICS_EVENTS.TASK_ADDED, { hasMood: true, hasCategory: false, hasPriority: false });
        dispatcher.dispatch(ANALYTICS_EVENTS.TASK_ADDED, { hasMood: false, hasCategory: false, hasPriority: false });
        dispatcher.dispatch(ANALYTICS_EVENTS.THEME_CHANGED, { theme: 'forest', taskText: 'hidden' });

        const snapshot = store.readSnapshot();
        expect(snapshot.total).toBe(3);
        expect(snapshot.events[ANALYTICS_EVENTS.TASK_ADDED].count).toBe(2);
        expect(snapshot.events[ANALYTICS_EVENTS.THEME_CHANGED].count).toBe(1);

        const variants = Object.keys(snapshot.events[ANALYTICS_EVENTS.THEME_CHANGED].variants);
        expect(variants).toEqual(['{"theme":"forest"}']);
    });
});
