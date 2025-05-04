declare module 'rivalz-client' {
  /**
   * Minimal typings for the RivalzClient constructor.
   * Extend this interface with more precise method signatures
   * as your codebase requires stricter type safety.
   */
  class RivalzClient {
    constructor(secret: string)
    /** Generic index signature to avoid compile-time errors for untyped SDK methods */
    [key: string]: any
  }

  export default RivalzClient
}
