import { mountTemplate } from '../dom.js';

export function renderToday(view, content) {
    mountTemplate(view, 'view-today');
    const list = view.querySelector('#chooserList');
    list.innerHTML = '';

    for (const path of content.chooser) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.className = 'chooser__card';
        button.type = 'button';
        button.innerHTML = `
            <p class="chooser__monster">${escapeHtml(path.monster.name)}</p>
            <p class="chooser__struggle">${escapeHtml(path.struggle)}</p>
        `;
        button.addEventListener('click', () => {
            location.hash = `#/ritual?monster=${encodeURIComponent(path.monster.slug)}&ritual=${encodeURIComponent(path.ritual.slug)}`;
        });
        li.appendChild(button);
        list.appendChild(li);
    }
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
