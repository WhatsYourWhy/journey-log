import { mountTemplate } from '../dom.js';
import { listEntries, clearAll, exportMarkdown } from '../store.js';

export function renderScroll(view, _content) {
    mountTemplate(view, 'view-scroll');
    const list = view.querySelector('#scrollList');
    const empty = view.querySelector('#scrollEmpty');
    const exportBtn = view.querySelector('#scrollExport');
    const clearBtn = view.querySelector('#scrollClear');

    function paint() {
        const entries = listEntries();
        list.innerHTML = '';

        if (entries.length === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        for (const e of entries) {
            const li = document.createElement('li');
            li.className = 'scroll__entry';
            const when = new Date(e.timestamp);
            li.innerHTML = `
                <p class="scroll__when">${when.toLocaleString()}</p>
                <p class="scroll__what">${escapeHtml(e.monsterName || '')} — ${escapeHtml(e.ritualTitle || '')}</p>
                ${e.note ? `<p class="scroll__note">${escapeHtml(e.note)}</p>` : ''}
            `;
            list.appendChild(li);
        }
    }

    exportBtn.addEventListener('click', () => {
        const md = exportMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mages-rituals-scroll-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Clear your entire scroll? This cannot be undone.')) {
            clearAll();
            paint();
        }
    });

    paint();
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
