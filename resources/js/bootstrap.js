import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

if (typeof window !== 'undefined' && typeof window.route === 'function') {
    const originalRoute = window.route;

    window.route = (name, params = {}, absolute = false, config) => {
        const fullUrl = originalRoute(name, params, absolute, config);

        try {
            const u = new URL(fullUrl, window.location.origin);
            // always return relative URL: /path?query#hash
            return u.pathname + u.search + u.hash;
        } catch {
            return fullUrl;
        }
    };
}