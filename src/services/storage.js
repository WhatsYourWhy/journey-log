(function (global) {
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

    const api = { createSafeStorage };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.JourneyLogStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
