import * as AWS from 'aws-sdk';
import * as path from 'path';

import { LoaderInterface } from './interface';
import { merge } from 'lodash';

export class S3Loader implements LoaderInterface {
  /**
   * @param bucket the S3 bucket where settings are stored
   * @param prefix the prefix (path/directory name) in the bucket where settings are found
   */
  constructor(private readonly bucket: string, private readonly prefix: string) {}

  load(env: string): any {
    const fn = cb => {
      this._load(env)
        .then(data => {
          cb(null, data);
        })
        .catch(cb);
    };

    const deasync = require('deasync');
    return deasync(fn)();
  }

  /**
   * Load settings from S3. You must have previously configured your AWS credentials,
   * using AWS.config.credentials or similar. https://goo.gl/sPqbRE If running on EC2 you
   * may have set an IAM role allowing access without credentials. Either way, it’s up to
   * you to ensure that credentials are in place before calling this function.
   * @param env the active environment (such as development or production)
   */
  private async _load(env: string): Promise<any> {
    let settings = {};

    const s3 = new AWS.S3();
    const prefix = this.prefix.endsWith('/') ? this.prefix : this.prefix + '/';

    let params: AWS.S3.ListObjectsV2Request = { Bucket: this.bucket, Prefix: prefix };
    let data: AWS.S3.ListObjectsV2Output;
    try {
      data = await s3.listObjectsV2(params).promise();
    } catch (err) {
      throw err;
    }

    const keys = data.Contents.map(k => k.Key);

    // Get the keys (filenames) of all the config files we are going to load, in the
    // order we want to load them. Later files override settings from earlier ones.
    let defaultKeys = keys
      .filter(k => k.startsWith(`${prefix}default/`) && k.endsWith('.json'))
      .sort();

    let envKeys = keys
      .filter(k => k.startsWith(`${prefix}${env}/`) && k.endsWith('.json'))
      .sort();

    let keysToLoad = defaultKeys.concat(envKeys);

    // Load all the files (in parallel, for speed) but don’t combine them into the single
    // settings object yet, because we want to ensure that happens in the correct order.
    const promises = keysToLoad.map<Promise<[string, any]>>(async key => {
      const response = await s3.getObject({ Bucket: this.bucket, Key: key }).promise();
      const data = JSON.parse(response.Body.toString());
      return [key, data];
    });

    const loadedKeys = new Map(await Promise.all(promises));

    // now build the resulting settings object by applying the loaded data in order
    for (const key of keysToLoad) {
      let baseKeyName = path.basename(key, path.extname(key));
      settings = merge(settings, { [baseKeyName]: loadedKeys.get(key) });
    }

    return settings;
  }
}
