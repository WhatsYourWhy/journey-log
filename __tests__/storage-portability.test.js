const { test, expect } = require('@playwright/test');
const {
    createJourneyExport,
    serializeJourneyExport,
    parseJourneyImport
} = require('../src/services/storage');

test.describe('storage portability', () => {
    test('invalid JSON is rejected', () => {
        expect(() => parseJourneyImport('{not-valid-json')).toThrow(/Invalid JSON file/);
    });

    test('successful import preserves key fields', () => {
        const input = JSON.stringify({
            tasks: [
                {
                    id: 101,
                    description: ' Plan sprint retrospective ',
                    completed: true,
                    selected: false,
                    mood: 'focused',
                    category: 'planning',
                    priority: 'high',
                    note: 'Bring highlights.'
                }
            ],
            settings: {
                theme: 'forest',
                wisdomEnabled: false,
                artfulMode: true
            }
        });

        const imported = parseJourneyImport(input, { createTaskId: () => 9999 });

        expect(imported.tasks).toHaveLength(1);
        expect(imported.tasks[0]).toEqual({
            id: 101,
            description: 'Plan sprint retrospective',
            completed: true,
            selected: false,
            mood: 'focused',
            category: 'planning',
            priority: 'high',
            note: 'Bring highlights.'
        });
        expect(imported.settings).toEqual({
            theme: 'forest',
            wisdomEnabled: false,
            artfulMode: true
        });
    });

    test('export and import round-trip keeps task and settings integrity', () => {
        const tasks = [
            {
                id: 1,
                description: 'Write daily reflection',
                completed: false,
                selected: true,
                mood: 'reflective',
                category: 'creative',
                priority: 'medium',
                note: 'Keep it short.'
            }
        ];
        const settings = {
            theme: 'ocean',
            wisdomEnabled: true,
            artfulMode: false
        };

        const exported = createJourneyExport(tasks, settings);
        const serialized = serializeJourneyExport(exported);
        const reImported = parseJourneyImport(serialized, { createTaskId: () => 7777 });

        expect(reImported.tasks).toEqual(tasks);
        expect(reImported.settings).toEqual(settings);
    });
});
