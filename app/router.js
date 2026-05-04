// Tiny hash router. Routes are keyed by path; query params parsed from hash.

function parseHash() {
    const raw = location.hash || '';
    const [path, query = ''] = raw.split('?');
    const params = Object.fromEntries(new URLSearchParams(query));
    return { path: path || '', params };
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
    function dispatch() {
        const { path, params } = parseHash();
        const handler = routes[path];
        if (handler) {
            highlightNav(path);
            handler(params);
        } else {
            location.hash = routes.default || '#/today';
        }
    }

    window.addEventListener('hashchange', dispatch);
    dispatch();
}
