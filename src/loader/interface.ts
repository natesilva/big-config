export interface LoaderInterface {
  load(env?: string): Promise<any>;
}
