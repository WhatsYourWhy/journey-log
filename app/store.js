// Local-only journal store. Nothing leaves the device.

const KEY = 'mages-rituals.scroll.v1';

function read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function write(entries) {
    try {
        localStorage.setItem(KEY, JSON.stringify(entries));
        return true;
    } catch {
        return false;
    }
}

export function listEntries() {
    return read().sort((a, b) => b.timestamp - a.timestamp);
}

export function addEntry(entry) {
    const entries = read();
    entries.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        ...entry
    });
    write(entries);
}

export function clearAll() {
    write([]);
}

export function exportMarkdown() {
    const entries = listEntries();
    if (entries.length === 0) return '# Your scroll\n\n_Empty._\n';
    const lines = ['# Your scroll', ''];
    for (const e of entries) {
        const when = new Date(e.timestamp).toISOString();
        lines.push(`## ${e.monsterName || 'Unknown'} — ${e.ritualTitle || ''}`);
        lines.push(`*${when}*`);
        lines.push('');
        if (e.note) {
            lines.push(e.note);
            lines.push('');
        }
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
}
