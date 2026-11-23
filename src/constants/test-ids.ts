/**
 * Central registry of `data-testid` values for Playwright specs.
 * Naming: kebab-case `<scope>-<element>`; each scope maps to one route or form.
 */

export const TEST_IDS = {
  FORM: {
    ITEM: (name: string) => `form-item-${name}`,
    INPUT: (name: string) => `form-input-${name}`,
    SELECT: (name: string) => `form-select-${name}`,
    SUBMIT: (name: string) => `form-submit-${name}`,
    ERROR: (name: string) => `form-error-${name}`,
  },
  AUTH: {
    LOGIN_FORM: "auth-login-form",
    REGISTER_FORM: "auth-register-form",
    LOGIN_LINK: "auth-login-link",
    REGISTER_LINK: "auth-register-link",
  },
  NAV: {
    PROFILE: "nav-profile",
    STUDENTS: "nav-students",
    LOGOUT: "nav-logout",
  },
  PROFILE: {
    FORM: "profile-form",
    GROUP: "profile-group",
    COUNSELOR: "profile-counselor",
    SAVED: "profile-saved",
  },
  ROSTER: {
    CREATE_FORM: "roster-create-form",
    GROUPS: "roster-groups",
    ASSIGN_FORM: "roster-assign-form",
    ASSIGNED: "roster-assigned",
    TABLE: "roster-table",
  },
} as const;
