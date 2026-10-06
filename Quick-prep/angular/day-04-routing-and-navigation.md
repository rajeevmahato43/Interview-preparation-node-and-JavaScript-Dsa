# Day 4: Routing and Navigation

## Router concepts

1. **Routes and outlets:** Route configuration maps a URL to a view; an outlet is the template location where the active route renders.
2. **Route state:** Parameters identify a resource; query parameters represent optional filters/state and should be parsed/validated.
3. **Lazy loading:** Defers route code until needed, reducing initial load work in suitable applications.
4. **Guards and resolvers:** Guards control client navigation; resolvers can load route data before activation. [Routing](https://angular.dev/guide/routing) | [Define routes](https://angular.dev/guide/routing/define-routes) | [Guards](https://angular.dev/guide/routing/route-guards)

## Tricky points

1. **Routes**
	1.1 **Client-side navigation:** A single-page app changes views without full-page reload; deep-link refresh still needs server fallback configuration.
	1.2 **Route parameters:** Treat URL values as untrusted strings; validate before use.
2. **Guards and loading**
	2.1 **Authorization:** A route guard improves UX but cannot secure backend data; the API must authorize each request.
	2.2 **Resolvers:** They delay route activation until data resolves; decide what loading/error experience the user sees.