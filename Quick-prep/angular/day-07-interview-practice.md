# Day 7: Feature Flow and Working Fluency

## Feature workflow

1. **Data flow:** Explain route → component/template → injected service → HTTP API → loading/success/error state.
2. **Component boundaries:** Keep UI state near its owner and shared behavior in services; use inputs/outputs for clear component communication.
3. **Testing:** Name one component behavior test and one service/HTTP boundary test; include failure and empty states.
4. **Backend boundary:** Frontend guards and validation help UX; the backend remains authoritative for permissions and data correctness. [Angular essentials](https://angular.dev/essentials) | [Angular tutorial](https://angular.dev/tutorials/learn-angular)

## Tricky points

1. **Project understanding**
	1.1 **Version:** Inspect package metadata and existing patterns before using standalone, signal, form, or router APIs.
	1.2 **UI versus service:** Components should not become unbounded containers for data access, state, and domain rules.
2. **Working fluency**
	2.1 **Authorization:** Hiding controls or guarding routes does not protect backend data.
	2.2 **Terminology:** Explain what a service, observable, signal, guard, or interceptor does in a concrete feature.
	2.3 **Scope:** This week targets ordinary feature contribution and interview vocabulary, not Angular-specialist expertise.