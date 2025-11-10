<!--
Sync Impact Report:
- Version change: N/A → 1.0.0
- New constitution created from template
- Modified principles: All principles newly defined
- Added sections: All sections
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md - reviewed and aligned
  ✅ spec-template.md - reviewed and aligned
  ✅ tasks-template.md - reviewed and aligned
- Follow-up TODOs: None
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

### II. Modern Angular Architecture

All Angular code MUST follow modern best practices:
- Standalone components only (NO NgModules except for compatibility requirements)
- Signal-based state management using `signal()`, `computed()`, and `effect()`
- `input()` and `output()` functions instead of `@Input()` and `@Output()` decorators
- `inject()` function for dependency injection instead of constructor injection
- OnPush change detection strategy for all components
- Native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Host bindings in the `host` object instead of `@HostBinding`/`@HostListener` decorators
- Lazy loading for all feature routes

**Rationale**: Modern Angular patterns improve performance, reduce boilerplate, provide better type safety, and align with the framework's evolution. Signals offer superior reactivity and simpler state management compared to traditional approaches.

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

### V. Comprehensive Testing with Jest (NON-NEGOTIABLE)

All code MUST be tested:
- Unit tests for all components, services, and utilities (minimum 80% coverage)
- Integration tests for critical user workflows
- Component tests using Angular Testing Library patterns and component harnesses
- Test-Driven Development (TDD) recommended: write tests before implementation when feasible
- Tests MUST be readable, maintainable, and fast (<5s per test suite)
- Use `jest-preset-angular` for optimal Angular + Jest integration
- Mock external dependencies appropriately

**Rationale**: Comprehensive testing prevents regressions, documents expected behavior, enables confident refactoring, and reduces production bugs. Jest provides fast, reliable testing with excellent developer experience.

### VI. Simple and Intuitive UX/UI

All user interfaces MUST:
- Prioritize simplicity and clarity over complexity
- Follow progressive disclosure patterns (show advanced features only when needed)
- Provide clear feedback for all user actions (loading states, success/error messages)
- Minimize cognitive load through consistent patterns and familiar interactions
- Ensure error messages are helpful and actionable

**Rationale**: Simple UX reduces training time, improves user satisfaction, and decreases support burden. Users can accomplish tasks faster with fewer errors.

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
- Use descriptive test names following "should" pattern
- Follow Arrange-Act-Assert pattern
- Clean up resources (subscriptions, timers) in `afterEach`
- Use component harnesses for Angular Material components
- Avoid implementation details (test behavior, not internals)

## Technology Constraints

### Required Stack

The project MUST use:
- **Framework**: Angular 20.x with standalone components
- **UI Library**: Angular Material 20.x
- **Testing**: Jest with `jest-preset-angular`
- **Language**: TypeScript 5.9.x with strict mode
- **State Management**: Angular Signals (no external state libraries unless justified)
- **Build Tool**: Angular CLI

### Prohibited Patterns

The following are PROHIBITED unless explicitly justified in the implementation plan:
- NgModules (except for backwards compatibility requirements)
- Zone.js-dependent patterns (prefer zoneless where possible)
- `any` type in TypeScript
- Structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`)
- Decorator-based inputs/outputs (`@Input`, `@Output`)
- Template-driven forms (use Reactive Forms)
- `ngClass` and `ngStyle` (use binding syntax)

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

**Version**: 1.0.0 | **Ratified**: 2025-11-10 | **Last Amended**: 2025-11-10