(function (global) {
    const PORTABLE_SCHEMA_VERSION = 1;

    function normalizeBoolean(value, fallback = false) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            if (value === 'true') return true;
            if (value === 'false') return false;
        }
        return fallback;
    }

    function normalizeText(value) {
        return typeof value === 'string' ? value : '';
    }

    function normalizeTaskRecord(task, options = {}) {
        if (!task || typeof task !== 'object' || Array.isArray(task)) return null;
        const description = normalizeText(task.description).trim();
        if (!description) return null;

        const fallbackId = options.createTaskId ? options.createTaskId() : Date.now();
        const normalizedId = Number(task.id);
        const id = Number.isFinite(normalizedId) ? normalizedId : fallbackId;

        return {
            id,
            description,
            completed: normalizeBoolean(task.completed, false),
            selected: normalizeBoolean(task.selected, false),
            mood: normalizeText(task.mood),
            category: normalizeText(task.category),
            priority: normalizeText(task.priority),
            note: normalizeText(task.note)
        };
    }

    function buildPortableSettings(settings = {}) {
        return {
            theme: normalizeText(settings.theme) || 'comfort',
            wisdomEnabled: normalizeBoolean(settings.wisdomEnabled, true),
            artfulMode: normalizeBoolean(settings.artfulMode, false),
            analyticsOptIn: normalizeBoolean(settings.analyticsOptIn, false)
        };
    }

    function createJourneyExport(tasks = [], settings = {}) {
        const normalizedTasks = Array.isArray(tasks)
            ? tasks.map(task => normalizeTaskRecord(task)).filter(Boolean)
            : [];

        return {
            schema: 'journey-log',
            version: PORTABLE_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            settings: buildPortableSettings(settings),
            tasks: normalizedTasks
        };
    }

    function serializeJourneyExport(payload) {
        return JSON.stringify(payload, null, 2);
    }

    function parseJourneyImport(jsonText, options = {}) {
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (error) {
            throw new Error('Invalid JSON file. Please choose a valid Journey export.');
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Import file must contain an object at the top level.');
        }

        if (parsed.schema && parsed.schema !== 'journey-log') {
            throw new Error('Import file schema is not supported by Journey Log.');
        }

        if (parsed.version && Number(parsed.version) > PORTABLE_SCHEMA_VERSION) {
            throw new Error('Import file version is newer than this app can read.');
        }

        if (!Array.isArray(parsed.tasks)) {
            throw new Error('Import file is missing a valid tasks list.');
        }

        const dedupeIds = new Set();
        const normalizedTasks = [];

        parsed.tasks.forEach((task) => {
            const normalized = normalizeTaskRecord(task, options);
            if (!normalized) return;
            while (dedupeIds.has(normalized.id)) {
                normalized.id = options.createTaskId ? options.createTaskId() : (normalized.id + 1);
            }
            dedupeIds.add(normalized.id);
            normalizedTasks.push(normalized);
        });

        if (normalizedTasks.length === 0 && parsed.tasks.length > 0) {
            throw new Error('Import file has tasks, but none are valid Journey steps.');
        }

        return {
            settings: buildPortableSettings(parsed.settings),
            tasks: normalizedTasks
        };
    }

    function createSafeStorage(storage, options = {}) {
        const showPersistenceStatus = options.showPersistenceStatus ?? (() => {});

        return {
            get(key, fallbackValue = null) {
                try {
                    const value = storage.getItem(key);
                    return value === null ? fallbackValue : value;
                } catch (error) {
                    console.warn(`Failed to read "${key}" from localStorage.`, error);
                    showPersistenceStatus('Storage unavailable: changes may not persist.');
                    return fallbackValue;
                }
            },
            set(key, value) {
                try {
                    storage.setItem(key, value);
                    return true;
                } catch (error) {
                    console.warn(`Failed to write "${key}" to localStorage.`, error);
                    showPersistenceStatus('Storage unavailable: unable to save right now.');
                    return false;
                }
            },
            remove(key) {
                try {
                    storage.removeItem(key);
                    return true;
                } catch (error) {
                    console.warn(`Failed to remove "${key}" from localStorage.`, error);
                    showPersistenceStatus('Storage unavailable: unable to clear saved data.');
                    return false;
                }
            }
        };
    }

    const api = {
        PORTABLE_SCHEMA_VERSION,
        createSafeStorage,
        normalizeTaskRecord,
        createJourneyExport,
        serializeJourneyExport,
        parseJourneyImport
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
