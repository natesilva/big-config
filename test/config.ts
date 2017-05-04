// // tslint:disable:no-unused-expression

// import * as fs from 'fs';
// import * as path from 'path';
// import * as tmp from 'tmp';

// import { only, suite, test } from 'mocha-typescript';

// import { Config } from '../src/config';
// import { ConfigError } from '../src/error';
// import { expect } from 'chai';

// // test fixtures: generate an array of {key: <uuid>, value: <uuid>}
// const fixtures = {
//     test1: {
//         input: {
//             default: {
//                 'database': { host: 'default.db', port: 3306, user: 'dbuser' },
//                 'aws': { region: 'us-west-2', profile: 'app-aws-profile' }
//             },

//             development: {
//                 'database': { host: 'dev.db', debug: true }
//             },

//             production: {
//                 'aws': { secretAccessKey: '1234567890ABCDEFG' },
//                 'redis': { host: 'redis.host' }
//             },

//             local: {
//                 'database': { user: 'otheruser' }
//             }
//         },

//         merged: {
//             development: {
//                 database: { host: 'dev.db', port: 3306, user: 'otheruser', debug: true },
//                 aws: { region: 'us-west-2', profile: 'app-aws-profile' }
//             },

//             production: {
//                 database: { host: 'default.db', port: 3306, user: 'otheruser' },
//                 aws: { region: 'us-west-2', profile: 'app-aws-profile', secretAccessKey: '1234567890ABCDEFG' },
//                 redis: { host: 'redis.host' }
//             },

//             staging: {
//                 database: { host: 'default.db', port: 3306, user: 'otheruser' },
//                 aws: { region: 'us-west-2', profile: 'app-aws-profile' }
//             }
//         }
//     }
// };


// const { name: jsonTmpDir } = tmp.dirSync({unsafeCleanup: true});
// const { name: jsTmpDir } = tmp.dirSync({unsafeCleanup: true});

// @suite('big-config configuration parser')
// export class BigConfigTests {
//   static before() {
//     // create the test files as JSON
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName].input;
//       const fixtureDir = path.join(jsonTmpDir, fixtureName);
//       fs.mkdirSync(fixtureDir);
//       Object.keys(fixture).forEach(envName => {
//         const env = fixture[envName];
//         const envDir = path.join(fixtureDir, envName);
//         fs.mkdirSync(envDir);
//         Object.keys(env).forEach(filename => {
//           const values = env[filename];
//           fs.writeFileSync(
//             path.join(envDir, filename + '.json'),
//             JSON.stringify(values)
//           );
//         });
//       });
//     });

//     // create the test files as JavaScript
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName].input;
//       const fixtureDir = path.join(jsTmpDir, fixtureName);
//       fs.mkdirSync(fixtureDir);
//       Object.keys(fixture).forEach(envName => {
//         const env = fixture[envName];
//         const envDir = path.join(fixtureDir, envName);
//         fs.mkdirSync(envDir);
//         Object.keys(env).forEach(filename => {
//           const values = env[filename];
//           fs.writeFileSync(
//             path.join(envDir, filename + '.js'),
//             `module.exports = ${JSON.stringify(values)};`
//           );
//         });
//       });
//     });
//   }

//   after() {
//     let keys = Object.keys(process.env).filter(k => k.startsWith('CONFIG__'));
//     keys.forEach(key => delete process.env[key]);

//     keys = Object.keys(process.env).filter(k => k.startsWith('BIGCONFIG_'));
//     keys.forEach(key => delete process.env[key]);
//   }

//   @test 'load configs from .json' () {
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName];
//       const envs = Object.keys(fixture.merged);

//       envs.forEach(env => {
//         const config = new Config(path.join(jsonTmpDir, fixtureName), env);
//         const expected = fixture.merged[env];
//         expect(config.getAll()).to.deep.equal(expected);
//         Object.keys(expected).forEach(key => {
//           expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
//         });
//       });
//     });
//   }

//   @test 'load configs from .js' () {
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName];
//       const envs = Object.keys(fixture.merged);

//       envs.forEach(env => {
//         const config = new Config(path.join(jsonTmpDir, fixtureName), env);
//         const expected = fixture.merged[env];
//         expect(config.getAll()).to.deep.equal(expected);
//         Object.keys(expected).forEach(key => {
//           expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
//         });
//       });
//     });
//   }

//   @test 'augment settings with environment variables' () {
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName];
//       const envs = Object.keys(fixture.merged);

//       const password = 'hunter1';
//       const host = 'env_host';
//       process.env.CONFIG__database__host = host;
//       process.env.CONFIG__database__password = password;

//       envs.forEach(env => {
//         const config = new Config(path.join(jsonTmpDir, fixtureName), env);
//         expect(config.get('database.password')).to.equal(password);
//         expect(config.get('database.host')).to.equal(host);
//       });
//     });
//   }

//   @test 'local takes precedence over environment variables' () {
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName];
//       const envs = Object.keys(fixture.merged);

//       // this env var should be ignored because local overrides it
//       process.env.CONFIG__database__user = 'suzyq';

//       envs.forEach(env => {
//         const config = new Config(path.join(jsonTmpDir, fixtureName), env);
//         const expected = fixture.merged[env];
//         expect(config.getAll()).to.deep.equal(expected);
//         Object.keys(expected).forEach(key => {
//           expect(config.get(key), `${fixtureName}/${env}/${key}`).to.deep.equal(expected[key]);
//         });
//       });
//     });
//   }

//   @test 'environment variables can be renamed' () {
//     Object.keys(fixtures).forEach(fixtureName => {
//       const fixture = fixtures[fixtureName];
//       const envs = Object.keys(fixture.merged);

//       const password = 'hunter1';
//       const host = 'env_host';
//       process.env.BIGCONFIG_ENV_PREFIX = 'MY_CONFIG_';
//       process.env.MY_CONFIG_database__host = host;
//       process.env.MY_CONFIG_database__password = password;

//       envs.forEach(env => {
//         const config = new Config(path.join(jsonTmpDir, fixtureName), env);
//         expect(config.get('database.password')).to.equal(password);
//         expect(config.get('database.host')).to.equal(host);
//       });

//       let keys = Object.keys(process.env).filter(k => k.startsWith('MY_CONFIG_'));
//       keys.forEach(key => delete process.env[key]);
//     });
//   }

//   @test 'missing config directory should throw' () {
//     const fn = () => {
//       // this very project doesn’t have a config dir
//       const config = new Config();
//     }
//     expect(fn).to.throw(ConfigError);
//   }

//   @test 'should throw if config dir name is a file instead of a dir' () {
//     const fn = () => {
//       const config = new Config(__filename);
//     }
//     expect(fn).to.throw(ConfigError);
//   }

//   @test 'should allow using an environment variable to specify the config dir' () {
//     process.env.BIGCONFIG_ROOT = jsonTmpDir;
//     const config = new Config();
//   }

//   @test 'should allow using a relative environment variable to specify the config dir' ()
//   {
//     process.env.BIGCONFIG_ROOT = './' + path.relative('.', jsonTmpDir);
//     const config = new Config();
//   }

//   @test 'default config location should be correct' ()
//   {
//     const actual = BigConfig.getConfigDir();
//     const expected = path.join(process.cwd(), 'config');
//     expect(actual).to.equal(expected);
//   }
// }
