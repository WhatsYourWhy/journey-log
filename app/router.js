// Tiny hash router with an explicit allowlist.
// The dispatch function calls each known handler at a literal call site, so
// the user-controlled hash path can never reach an inherited Object method.

const KNOWN_PATHS = ['#/today', '#/ritual', '#/scroll'];

function parseHash() {
    const raw = location.hash || '';
    const [path, query = ''] = raw.split('?');
    return { path: path || '', params: Object.fromEntries(new URLSearchParams(query)) };
}

function highlightNav(path) {
    document.querySelectorAll('.app-nav a').forEach((link) => {
        const linkPath = link.getAttribute('href');
        if (path.startsWith(linkPath)) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

export function router(routes) {
    const today = typeof routes['#/today'] === 'function' ? routes['#/today'] : null;
    const ritual = typeof routes['#/ritual'] === 'function' ? routes['#/ritual'] : null;
    const scroll = typeof routes['#/scroll'] === 'function' ? routes['#/scroll'] : null;
    const fallback = routes.default || '#/today';

    function dispatch() {
        const { path, params } = parseHash();
        if (!KNOWN_PATHS.includes(path)) {
            location.hash = fallback;
            return;
        }
        highlightNav(path);
        switch (path) {
            case '#/today':
                if (today) today(params);
                break;
            case '#/ritual':
                if (ritual) ritual(params);
                break;
            case '#/scroll':
                if (scroll) scroll(params);
                break;
        }
    }

    window.addEventListener('hashchange', dispatch);
    dispatch();
}
