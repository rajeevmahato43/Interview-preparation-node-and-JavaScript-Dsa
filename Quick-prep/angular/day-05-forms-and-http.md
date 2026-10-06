# Day 5: Forms and HTTP

## Forms

1. **Reactive forms:** Form controls/groups are explicit in TypeScript; suited to complex, reusable, testable forms.
2. **Template-driven forms:** Directives build the form model from the template; useful for simpler forms.
3. **Validation:** Built-in/custom validators provide client feedback; the server must validate and enforce domain rules independently. [Forms](https://angular.dev/guide/forms) | [Validation](https://angular.dev/guide/forms/form-validation)

## HTTP client

1. **`HttpClient`:** Angular service for typed request/response handling; account for pending, success, and error states.
2. **Interceptors:** Apply cross-cutting request/response behavior such as auth headers or common error mapping; keep feature logic in services/components.
3. **Testing:** HTTP testing utilities let tests assert outgoing requests and provide controlled responses. [HTTP](https://angular.dev/guide/http) | [Interceptors](https://angular.dev/guide/http/interceptors) | [HTTP testing](https://angular.dev/guide/http/testing)

## Tricky points

1. **Forms**
	1.1 **Reactive versus template-driven:** Reactive forms expose a synchronous explicit model; template-driven forms rely more on template directives and change detection.
	1.2 **Validation:** Client validation can be bypassed; server validation is authoritative.
2. **HTTP**
	2.1 **Interceptor retries:** Retrying a mutation can duplicate effects unless the endpoint is idempotent/protected.
	2.2 **Types:** A TypeScript response type is not runtime validation of server JSON.
	2.3 **Version/configuration:** HttpClient and interceptor setup patterns vary with Angular project version/style.