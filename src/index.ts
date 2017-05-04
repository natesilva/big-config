import { BigConfig, S3Config } from './bigConfig';

let config = null;

export function Config(s3Config?: S3Config) {
  if (config) { return config; }
}
