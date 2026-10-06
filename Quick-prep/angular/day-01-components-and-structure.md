# Day 1: Components and Application Structure

## Angular building blocks

1. **Component:** TypeScript class plus metadata/template that defines a view and its behavior.
2. **Template:** HTML with Angular binding/control-flow syntax; the component tree composes an application UI.
3. **Standalone and NgModule:** Current Angular components are standalone by default; older projects may organize declarations through NgModules. Check project version/conventions.
4. **CLI and project structure:** Angular CLI generates/builds projects; understand where routes, components, services, and tests live before changing structure. [Overview](https://angular.dev/overview) | [Components](https://angular.dev/guide/components) | [NgModules](https://angular.dev/guide/ngmodules/overview)

## Tricky points

1. **Components**
	1.1 **Standalone imports:** A standalone component imports the components/directives/pipes its template uses; do not assume every project uses NgModules.
	1.2 **Version defaults:** Standalone defaults changed by Angular version; inspect the repository version before answering.
2. **Application boundaries**
	2.1 **UI versus backend:** Frontend components cannot securely hold secrets or enforce authorization for API data.
	2.2 **Responsibilities:** Large components that own routing, API calls, validation, and presentation become harder to test and change.