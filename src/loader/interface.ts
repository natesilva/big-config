export interface Loader {
  load(env?: string): Promise<any>;
}
