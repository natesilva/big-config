export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BigConfigError';
    this.stack = (new Error()).stack;
  }
}
