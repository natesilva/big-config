export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
    this.stack = (new Error()).stack;
  }
}
