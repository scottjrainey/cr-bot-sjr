# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.0.5](https://github.com/scottjrainey/cr-bot-sjr/compare/cr-bot-sjr-v0.0.4...cr-bot-sjr-v0.0.5) (2025-05-20)


### Bug Fixes

* update package description to reflect error handling improvements ([eb2529e](https://github.com/scottjrainey/cr-bot-sjr/commit/eb2529e2352db04b4875b666ee223958171a05b5))
* **versioning:** Added a latest tag ([3256cb3](https://github.com/scottjrainey/cr-bot-sjr/commit/3256cb3560cad27742e95cae055a760ed42be0aa))

## [0.0.4](https://github.com/scottjrainey/cr-bot-sjr/compare/cr-bot-sjr-v0.0.3...cr-bot-sjr-v0.0.4) (2025-05-20)


### Bug Fixes

* Removed unused job from deploy ([e890936](https://github.com/scottjrainey/cr-bot-sjr/commit/e8909362e3b074a151930296b0383f6aa3ad9fd4))
* **versioning:** Add debugging and VERSION fallback logic to deploy ([b23f5f8](https://github.com/scottjrainey/cr-bot-sjr/commit/b23f5f8b02b91e448b1c9e631660d0d2aa31c0aa))
* **versioning:** Change logic for passing ENV vars between jobs ([59b4e60](https://github.com/scottjrainey/cr-bot-sjr/commit/59b4e607e812959117b74eb570bdbbc5098318d6))
* **versioning:** Debug statements for missing VERSION value in deploy job ([71119a3](https://github.com/scottjrainey/cr-bot-sjr/commit/71119a3e0e6f72f7b73256f2ecc4c47729dd838b))
* **versioning:** Debugging and new logic for tagging in release job ([f9dbd79](https://github.com/scottjrainey/cr-bot-sjr/commit/f9dbd7975bef3e60e1eb5c1c7a35fe7f2b7df5ad))
* **versioning:** Do not rely on release-please output variables ([2d58325](https://github.com/scottjrainey/cr-bot-sjr/commit/2d5832594b8d9db1cd25cf2c6efb50ad042d8f22))
* **versioning:** Fix to gcr.io container name in deploy job ([2b1fe27](https://github.com/scottjrainey/cr-bot-sjr/commit/2b1fe2748c5fcf9e9b061c8dd3896581cba9eea2))
* **versioning:** Update logic assign VERSION in release job ([e0f463f](https://github.com/scottjrainey/cr-bot-sjr/commit/e0f463f44e680735de9806228e928a83397a1623))
* **versioning:** Update to VERSION setting logic in release step ([3e18cc8](https://github.com/scottjrainey/cr-bot-sjr/commit/3e18cc84f308fd5165ce7e981dda0e3bf7d7f2fb))
* **versioning:** Update version of pnpm in deploy job ([d318783](https://github.com/scottjrainey/cr-bot-sjr/commit/d318783002bb93bf679a83e03d7782acea840f10))
* **versoning:** Adjusted container labeling logic in release job ([30cbf37](https://github.com/scottjrainey/cr-bot-sjr/commit/30cbf3757eab850313cca9d996a78dd7a063ef6c))

## [0.0.3](https://github.com/scottjrainey/cr-bot-sjr/compare/cr-bot-sjr-v0.0.2...cr-bot-sjr-v0.0.3) (2025-05-19)


### Bug Fixes

* **versioning:** Update deploy to run on PR merge ([6f5c695](https://github.com/scottjrainey/cr-bot-sjr/commit/6f5c69534718c344d757cad59af54cad8305ad33))

## [0.0.2](https://github.com/scottjrainey/cr-bot-sjr/compare/cr-bot-sjr-v0.0.1...cr-bot-sjr-v0.0.2) (2025-05-19)


### Features

* add enhanced error handling ([59728be](https://github.com/scottjrainey/cr-bot-sjr/commit/59728be035db3a76c1d28102ba252a838c8c739a))
* add versioning documentation ([1f4dce5](https://github.com/scottjrainey/cr-bot-sjr/commit/1f4dce5c2a8b4dd93a4ee5eac4215be4b54c89c4))
* **versioning:** Add versioning support ([9ca2527](https://github.com/scottjrainey/cr-bot-sjr/commit/9ca2527a51b4869b94a5ac85af579b2a3f7d1b9e))


### Bug Fixes

* add pull-requests write permission for release-please ([ffa99fc](https://github.com/scottjrainey/cr-bot-sjr/commit/ffa99fcdf6fa965a99fdc15827997ffd526db943))
* test release-please debug ([7e776a8](https://github.com/scottjrainey/cr-bot-sjr/commit/7e776a81c824a002c3053041a0aa572bd4e0e666))
* **versioning:** Add debug logging to release job ([47d84c1](https://github.com/scottjrainey/cr-bot-sjr/commit/47d84c19303e54d08c9b891d7c7fe4ac3e52eca2))
* **versioning:** Add issues:write permission for release-please ([989bbc8](https://github.com/scottjrainey/cr-bot-sjr/commit/989bbc83b19370c535ba684afc3e460e08f49316))
* **versioning:** Fully automate release pipeline ([47c8768](https://github.com/scottjrainey/cr-bot-sjr/commit/47c876833fc7c27e6aa9c15055084096a6b24cca))
* **versioning:** Remove skip-github-pull-request: true for debugging ([1c4b14f](https://github.com/scottjrainey/cr-bot-sjr/commit/1c4b14f87ebd882d1c6dab9d203d3672406cdbb1))
* **versioning:** remove unused variabble 'commits' for CI ([143498e](https://github.com/scottjrainey/cr-bot-sjr/commit/143498e5522f80e94a80cd8d37789240e0098361))
* **versioning:** test release-please ([9ee6f60](https://github.com/scottjrainey/cr-bot-sjr/commit/9ee6f60bf373e7b19e769cab127bcaac974c8d42))
* **versioning:** Update depricated action ([8269e38](https://github.com/scottjrainey/cr-bot-sjr/commit/8269e38cd143284104bf568c5c147cf227b27308))

### 0.0.1 (2025-05-19)


### Features

* **versioning:** Add versioning support ([9ca2527](https://github.com/scottjrainey/cr-bot-sjr/commit/9ca2527a51b4869b94a5ac85af579b2a3f7d1b9e))
