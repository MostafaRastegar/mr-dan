/**
 * Health probe port. Implemented by infrastructure adapters so the health
 * route never talks to Postgres or Chroma directly.
 */
export interface HealthProbe {
  readonly name: string;
  /** Throws when the dependency is unreachable. */
  check(): Promise<void>;
}
