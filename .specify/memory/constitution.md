<!--
Sync Impact Report:
- Version change: 1.3.1 → 2.0.0
- Modified principles:
  - Principle V: "Comprehensive Testing" - Changed from Karma/Jasmine to Vitest (BREAKING CHANGE)
- Added sections:
  - Technology Constraints: Vitest testing framework mandate with @analogjs/vitest-angular
  - Development Workflow: Vitest-specific testing standards
- Removed sections:
  - Technology Constraints: Karma and Jasmine references removed
- Templates requiring updates:
  ✅ plan-template.md - reviewed, constitution check is flexible enough to accommodate
  ✅ spec-template.md - reviewed, technology-agnostic by design
  ✅ tasks-template.md - reviewed, test task structure remains valid
  ⚠ Commands in .specify/templates/commands/ - directory not found, skipped
- Follow-up TODOs:
  - Migration from Karma/Jasmine to Vitest required for existing tests
  - Update package.json dependencies
  - Create vite.config.ts for Vitest configuration
  - Update tsconfig.spec.json for Vitest types
  - Update angular.json test builder
  - Create new test-setup.ts for zoneless mode
-->

# Booksfeir Constitution

## Core Principles

### I. Clean Code Foundation

All code MUST adhere to clean code principles:
- Single Responsibility Principle for all components, services, and modules
- DRY (Don't Repeat Yourself) - eliminate code duplication through shared utilities and services
- Clear, descriptive naming for all variables, functions, components, and files
- Functions and methods kept small and focused (ideally < 20 lines)
- Meaningful comments only when code cannot be self-explanatory

**Rationale**: Clean code ensures long-term maintainability, reduces technical debt, and makes the codebase accessible to all team members. It minimizes bugs and accelerates feature development.

### II. Modern Angular Architecture (NON-NEGOTIABLE)

All Angular code MUST follow modern best practices:
- Standalone components only (NO NgModules except for compatibility requirements)
- Signal-based state management using `signal()`, `computed()`, and `effect()`
- `input()` and `output()` functions instead of `@Input()` and `@Output()` decorators
- `inject()` function for dependency injection instead of constructor injection
- OnPush change detection strategy for all components
- Native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Host bindings in the `host` object instead of `@HostBinding`/`@HostListener` decorators
- Lazy loading for all feature routes
- **Zoneless operation**: Application MUST run without zone.js (use `provideExperimentalZonelessChangeDetection()`)

**Rationale**: Modern Angular patterns improve performance, reduce boilerplate, provide better type safety, and align with the framework's evolution. Signals offer superior reactivity and simpler state management compared to traditional approaches. Running without zone.js eliminates overhead, improves performance, and aligns with Angular's future direction.

### III. TypeScript Strict Mode (NON-NEGOTIABLE)

All TypeScript code MUST:
- Use strict type checking enabled in `tsconfig.json`
- Avoid the `any` type; use `unknown` when type is uncertain
- Prefer type inference when the type is obvious
- Define explicit interfaces for all data models and API contracts
- Use type guards for runtime type validation

**Rationale**: Strict typing catches errors at compile time, improves IDE support, serves as documentation, and prevents runtime errors. The `any` type undermines TypeScript's benefits and hides potential bugs.

### IV. Angular Material Design System

All UI components MUST:
- Use Angular Material components for all UI elements
- Follow Material Design guidelines for spacing, typography, and color
- Maintain consistent theming across the application
- Ensure accessibility (ARIA labels, keyboard navigation, screen reader support)
- Implement responsive design for mobile, tablet, and desktop viewports

**Rationale**: Angular Material provides battle-tested, accessible components that ensure consistency and reduce development time. Material Design creates a cohesive, professional user experience.

### V. Comprehensive Testing with Vitest (NON-NEGOTIABLE)

All code MUST be tested using Vitest exclusively:
- Unit tests for all components, services, and utilities (minimum 80% coverage)
- Integration tests for critical user workflows
- Component tests using Angular Testing Library patterns and component harnesses
- Test-Driven Development (TDD) recommended: write tests before implementation when feasible
- Tests MUST be readable, maintainable, and fast (<5s per test suite)
- Use Vitest test runner with `@analogjs/vitest-angular` integration
- Mock external dependencies appropriately
- Leverage Angular Testing utilities (`TestBed`, component harnesses, fixtures)
- Configure tests for zoneless mode using `@analogjs/vitest-angular/setup-snapshots`

**Rationale**: Comprehensive testing prevents regressions, documents expected behavior, enables confident refactoring, and reduces production bugs. Vitest provides blazing-fast test execution, native ESM support, instant watch mode, and seamless Vite integration. Combined with `@analogjs/vitest-angular`, it offers superior performance over traditional Karma/Jasmine setups while maintaining full Angular testing capabilities. Vitest's modern architecture aligns with the project's commitment to cutting-edge tooling and developer experience.

### VI. Simple and Intuitive UX/UI

All user interfaces MUST:
- Prioritize simplicity and clarity over complexity
- Follow progressive disclosure patterns (show advanced features only when needed)
- Provide clear feedback for all user actions (loading states, success/error messages)
- Minimize cognitive load through consistent patterns and familiar interactions
- Ensure error messages are helpful and actionable

**Rationale**: Simple UX reduces training time, improves user satisfaction, and decreases support burden. Users can accomplish tasks faster with fewer errors.

### VII. Context7 Documentation Integration

All development workflows MUST:
- Use Context7 MCP tools for code generation, setup, and configuration steps
- Automatically resolve library IDs using `mcp__context7__resolve-library-id` when documentation is needed
- Retrieve up-to-date library documentation using `mcp__context7__get-library-docs` for API references
- Consult Context7 documentation before implementing unfamiliar patterns or libraries
- Prioritize Context7-sourced documentation over manual web searches for supported libraries

**Rationale**: Context7 provides consistent, up-to-date, and contextually relevant documentation directly in the development workflow. This reduces context switching, ensures accuracy, and accelerates implementation by providing trusted code examples and API references at the point of need.

### VIII. Mock-First Development for External Services

All external service integrations MUST:
- Implement mock/stub services for local development before production implementations
- Create service interfaces that abstract external dependencies (GCP services, third-party APIs)
- Use dependency injection to swap between mock and real implementations
- Ensure application functionality can be fully developed and tested without live external services
- Document mock service behavior and limitations clearly
- Design mocks to match production service contracts and error scenarios

**External Service Coverage**:
- GCP Datastore (database operations)
- GCP Identity Federation (authentication)
- Google Books API v1 (book search with query format: `q="{terms}"+subject:Computers`)

**Rationale**: Mock-first development enables rapid local development without cloud dependencies, reduces development costs, allows offline work, and ensures testability. Service abstraction prevents vendor lock-in and facilitates testing edge cases and error conditions that are difficult to reproduce with live services.

## Development Workflow

### Code Review Requirements

All code changes MUST:
- Pass through pull request review by at least one team member
- Include accompanying tests for all new functionality
- Pass all CI checks (tests, linting, build)
- Update relevant documentation when behavior changes
- Follow conventional commit message format

### Quality Gates

Before merging, all pull requests MUST:
- Achieve minimum 80% test coverage for new code
- Pass all unit and integration tests
- Pass TypeScript compilation with strict mode
- Pass ESLint and Prettier checks
- Build successfully without warnings

### Testing Standards

All tests MUST:
- Be isolated and independent (no test interdependencies)
- Use descriptive test names following "should" pattern or descriptive strings
- Follow Arrange-Act-Assert pattern
- Clean up resources (subscriptions, timers) in `afterEach`
- Use component harnesses for Angular Material components
- Avoid implementation details (test behavior, not internals)
- Run in zoneless mode matching the application runtime environment

### Vitest-Specific Testing Standards

All Vitest tests MUST:

- Use Vitest's native API (`describe`, `it`, `expect`, `beforeEach`, `afterEach`)
- Leverage Vitest's fast watch mode during development
- Use snapshot testing for component regression testing (`toMatchSnapshot()`)
- Configure proper setup files for Angular TestBed initialization
- Run tests in jsdom environment or browser mode for component tests
- Use Vitest's built-in mocking capabilities (`vi.mock()`, `vi.fn()`, `vi.spyOn()`)
- Maintain fast test execution (leverage Vitest's parallel execution and smart test re-run)

### Mocking Standards

All external service mocks MUST:
- Implement the same TypeScript interfaces as production services
- Provide realistic data and response delays
- Support common error scenarios (network failures, authentication errors, rate limiting)
- Be configurable for different test scenarios
- Document differences from production behavior
- Be maintained alongside production implementations to prevent drift

## Technology Constraints

### Required Stack

The project MUST use:
- **Framework**: Angular 20.x with standalone components
- **UI Library**: Angular Material 20.x
- **Testing**: Vitest with `@analogjs/vitest-angular` (NON-NEGOTIABLE)
- **Language**: TypeScript 5.9.x with strict mode
- **State Management**: Angular Signals (no external state libraries unless justified) and RxJS
- **Build Tool**: Angular CLI with Vite integration for testing
- **Change Detection**: Zoneless (`provideExperimentalZonelessChangeDetection()`)
- **Documentation Tool**: Context7 MCP for library documentation and code generation
- **Database**: GCP Datastore (NoSQL managed database, mocked for local development)
- **Authentication**: GCP Identity Federation (federated identity provider, mocked for local development)
- **External APIs**: Google Books API v1 (`https://www.googleapis.com/books/v1/volumes`) for book search functionality

### Test Configuration Requirements

The project MUST include:

- **vite.config.ts**: Vitest configuration with `@analogjs/vite-plugin-angular`
- **test-setup.ts**: Angular TestBed initialization for zoneless mode
- **tsconfig.spec.json**: TypeScript configuration with Vitest global types
- **angular.json**: Test builder configured to use `@analogjs/vitest-angular:test`

### Prohibited Patterns

The following are PROHIBITED unless explicitly justified in the implementation plan:
- NgModules (except for backwards compatibility requirements)
- **Zone.js usage**: Application MUST operate without zone.js (NON-NEGOTIABLE)
- Zone.js-dependent patterns (e.g., relying on automatic change detection triggers)
- **Karma test runner**: Vitest is the exclusive testing framework (NON-NEGOTIABLE)
- **Jasmine testing framework**: Use Vitest's native assertion API (NON-NEGOTIABLE)
- `any` type in TypeScript
- Structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`)
- Decorator-based inputs/outputs (`@Input`, `@Output`)
- Template-driven forms (use Reactive Forms)
- `ngClass` and `ngStyle` (use binding syntax)
- Constructor-based dependency injection (use `inject()` function)
- Promise
- OnInit implementation

## Governance

### Amendment Process

This constitution can be amended through:
1. Proposal submitted via pull request to `.specify/memory/constitution.md`
2. Documented rationale for the change
3. Review and approval from project maintainers
4. Update of all dependent templates and documentation
5. Semantic versioning increment (see below)

### Version Management

Constitution versions follow semantic versioning:
- **MAJOR**: Backward-incompatible changes (removed principles, redefined core constraints)
- **MINOR**: New principles added or material expansions to existing guidance
- **PATCH**: Clarifications, wording improvements, non-semantic updates

### Compliance Review

All development activities MUST:
- Reference this constitution during planning (see `plan-template.md` Constitution Check)
- Verify compliance during code review
- Document any deviations with explicit justification in the implementation plan
- Escalate conflicts between constitution and requirements to project lead

### Runtime Guidance

For implementation-specific guidance, refer to:
- `.claude/CLAUDE.md` - AI assistant development guidelines
- `README.md` - Project setup and development instructions
- Angular and Angular Material official documentation
- Context7 MCP for up-to-date library documentation

**Version**: 2.0.0 | **Ratified**: 2025-11-10 | **Last Amended**: 2025-11-21
