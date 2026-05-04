// Content loader. Fetches the JSON files emitted by scripts/build-content.js.

const FILES = ['chooser', 'monsters', 'spellbook'];

export async function loadContent() {
    const entries = await Promise.all(
        FILES.map(async (name) => {
            const response = await fetch(new URL(`./data/${name}.json`, import.meta.url));
            if (!response.ok) {
                throw new Error(`Failed to load ${name}.json (${response.status})`);
            }
            return [name, await response.json()];
        })
    );
    const content = Object.fromEntries(entries);

    content.monstersBySlug = new Map(content.monsters.map((m) => [m.slug, m]));
    content.ritualsBySlug = new Map(content.spellbook.map((r) => [r.slug, r]));

    return content;
}
