# Day 6: Lifecycle, Signals, and Debugging

## Lifecycle and rendering

1. **Lifecycle hooks:** Hooks provide points for input changes, view initialization, and destruction; use only when that lifecycle event is relevant.
2. **Change detection:** Angular updates views as application state changes; exact strategy/default behavior depends on Angular version/configuration.
3. **Signals:** `signal` stores reactive state, `computed` derives values, and Angular tracks reads to update dependent views. [Lifecycle](https://angular.dev/guide/components/lifecycle) | [Signals](https://angular.dev/guide/signals)

## Debugging and quality

1. **DevTools:** Inspect component/injector trees and profile rendering; use browser network tools to inspect API failures.
2. **Testing:** Test component behavior and service/HTTP boundaries; avoid tests coupled to framework internals.
3. **Security/accessibility:** Use Angular security guidance and ensure forms/navigation work with keyboard and assistive technology. [DevTools](https://angular.dev/tools/devtools) | [Testing](https://angular.dev/guide/testing) | [Security](https://angular.dev/best-practices/security) | [Accessibility](https://angular.dev/best-practices/a11y)

## Tricky points

1. **Lifecycle and rendering**
	1.1 **Frequent hooks:** Expensive calculations in often-run hooks/templates can slow rendering.
	1.2 **Signals:** A computed signal is read-only; update its writable source.
	1.3 **Version:** Lifecycle and change-detection details evolve; check installed Angular version.
2. **Debugging**
	2.1 **Stale view:** Trace state source → service/request → component binding → render rather than adding manual DOM changes first.
	2.2 **Optimization:** Profile before changing change-detection strategy.