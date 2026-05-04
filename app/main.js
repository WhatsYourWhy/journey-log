// The Mage's Rituals — entry point.
// Three views (today / ritual / scroll) with hash routing.
// All data is local. Content comes from /data/*.json (built from the site).

import { router } from './router.js';
import { renderToday } from './views/today.js';
import { renderRitual } from './views/ritual.js';
import { renderScroll } from './views/scroll.js';
import { loadContent } from './content.js';

const view = document.getElementById('view');

async function bootstrap() {
    let content;
    try {
        content = await loadContent();
    } catch (error) {
        view.innerHTML = `
            <section class="today">
                <p class="today__lead">Could not load the bestiary.</p>
                <p>${error.message}</p>
                <p class="today__footnote">If you are the maker: run <code>npm run build:content</code>.</p>
            </section>
        `;
        return;
    }

    const notice = document.getElementById('bootstrapNotice');
    if (notice) notice.remove();

    router({
        '#/today': () => renderToday(view, content),
        '#/ritual': (params) => renderRitual(view, content, params),
        '#/scroll': () => renderScroll(view, content),
        default: '#/today'
    });
}

bootstrap();
