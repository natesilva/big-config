## 1.4.0 (2017-09-06)

* The `deasync` dependency, needed for S3 only, is never loaded unless you attempt to load configuration from S3. This dependency requires a binary component which may not be available on all platforms, notably AWS Lambda. As long as you don’t use S3 configurations, `big-config` should now work on those platforms.
