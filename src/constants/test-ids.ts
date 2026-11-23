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
    SCHEDULE: "nav-schedule",
    HOMEWORK: "nav-homework",
    STUDY: "nav-study",
    LOGOUT: "nav-logout",
    NUTRITION: "nav-nutrition",
    LEISURE: "nav-leisure",
  },
  SCHEDULE: {
    FORM: "schedule-form",
    TABLE: "schedule-table",
    CREATE_FORM: "schedule-create-form",
    EMPTY: "schedule-empty",
    SAVED: "schedule-saved",
    DELETE: "schedule-delete",
    DELETE_ENTRY: "schedule-delete-entry",
  },
  HOMEWORK: {
    FORM: "homework-form",
    TABLE: "homework-table",
    CREATE_FORM: "homework-create-form",
    EMPTY: "homework-empty",
    SAVED: "homework-saved",
    DELETE: "homework-delete",
  },
  STUDY: {
    FORM: "study-form",
    TABLE: "study-table",
    CREATE_FORM: "study-create-form",
    EMPTY: "study-empty",
    SAVED: "study-saved",
    DELETE: "study-delete",
    TIMER_START: "study-timer-start",
    TIMER_PAUSE: "study-timer-pause",
    TIMER_RESUME: "study-timer-resume",
    TIMER_RESET: "study-timer-reset",
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
  NUTRITION: {
    FORM: "nutrition-form",
    SAVED: "nutrition-saved",
    BMR: "nutrition-bmr",
    TDEE: "nutrition-tdee",
    TARGET: "nutrition-target",
    INCOMPLETE: "nutrition-incomplete",
    PLAN: "nutrition-plan",
    SAVE_PLAN: "nutrition-save-plan",
  },
  LEISURE: {
    PANEL: "leisure-panel",
    BOOK: "leisure-book",
  },
} as const;
