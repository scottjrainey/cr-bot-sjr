## 0.1.0 (2025-06-18)




## [0.1.1](https://github.com/scottjrainey/cr-bot-sjr/compare/cr-bot-sjr-v0.1.0...cr-bot-sjr-v0.1.1) (2025-06-18)


### Features

* add enhanced error handling ([f5f8a3e](https://github.com/scottjrainey/cr-bot-sjr/commit/f5f8a3ebb4bd4555cfd1ae002648499482739a28))
* add versioning documentation ([aeee93c](https://github.com/scottjrainey/cr-bot-sjr/commit/aeee93cddfcc94f67f770990a258daf4fcc58ef3))
* **langfuse:** Set up of Langfuse ([2c665d4](https://github.com/scottjrainey/cr-bot-sjr/commit/2c665d4723c63d5cbe1285dc70f227c53c2f1a08))
* **versioning:** Add versioning support ([dfb67df](https://github.com/scottjrainey/cr-bot-sjr/commit/dfb67df24c5495f0ebada95102a97207d70c34d4))


### Bug Fixes

* add pull-requests write permission for release-please ([674e432](https://github.com/scottjrainey/cr-bot-sjr/commit/674e4329ed8d2e8024aeb13f63321a21c22dda6d))
* Removed unused job from deploy ([647c81d](https://github.com/scottjrainey/cr-bot-sjr/commit/647c81dc3407e61cb955ec86dad9fc5d0b8448d0))
* test release-please debug ([3013704](https://github.com/scottjrainey/cr-bot-sjr/commit/3013704180b931a383d33bd0314c538a46b4c3e4))
* update package description to reflect error handling improvements ([6a7be03](https://github.com/scottjrainey/cr-bot-sjr/commit/6a7be036ee9f6b4ef72f2477865112e541795159))
* **versioning:** Add debug logging to release job ([4e5a263](https://github.com/scottjrainey/cr-bot-sjr/commit/4e5a263d66b2a3f01d2e425247db797c2322496b))
* **versioning:** Add debugging and VERSION fallback logic to deploy ([f643872](https://github.com/scottjrainey/cr-bot-sjr/commit/f643872c2e4133de4aa1a28f1ef91367f737feda))
* **versioning:** Add issues:write permission for release-please ([d0815a5](https://github.com/scottjrainey/cr-bot-sjr/commit/d0815a5723ee69b51b6842190e9908df9d538c2b))
* **versioning:** Added a latest tag ([d0e3506](https://github.com/scottjrainey/cr-bot-sjr/commit/d0e35060156a82eb90c209212e9265fcf8dc18df))
* **versioning:** Adjusted container labeling logic in release job ([cacbf45](https://github.com/scottjrainey/cr-bot-sjr/commit/cacbf45bcbafdc0339f7faff18a5a4977a9f8cee))
* **versioning:** Change logic for passing ENV vars between jobs ([875bca9](https://github.com/scottjrainey/cr-bot-sjr/commit/875bca947adb4e48726a1d077d4656e4f0535238))
* **versioning:** Debug statements for missing VERSION value in deploy job ([ca32441](https://github.com/scottjrainey/cr-bot-sjr/commit/ca3244145e90924dd3a493523731c9f7380e609f))
* **versioning:** Debugging and new logic for tagging in release job ([89be3f7](https://github.com/scottjrainey/cr-bot-sjr/commit/89be3f7e7e6369ad4c0c53f1761ae3b3ac9d029f))
* **versioning:** Do not rely on release-please output variables ([705a2aa](https://github.com/scottjrainey/cr-bot-sjr/commit/705a2aa9db6cd25979884571287c435b3aaaf35b))
* **versioning:** Fix to gcr.io container name in deploy job ([5216635](https://github.com/scottjrainey/cr-bot-sjr/commit/52166356f1fc03451c93961b1686f93e973563fa))
* **versioning:** Fully automate release pipeline ([7547fb8](https://github.com/scottjrainey/cr-bot-sjr/commit/7547fb87b405316f228e845da0f9ff78542864ac))
* **versioning:** Remove skip-github-pull-request: true for debugging ([d994c73](https://github.com/scottjrainey/cr-bot-sjr/commit/d994c73213df5495d87e61b76c0b4fee51561731))
* **versioning:** remove unused variabble 'commits' for CI ([7c25b11](https://github.com/scottjrainey/cr-bot-sjr/commit/7c25b1167c8c51374fb48922e86317248e3cf71e))
* **versioning:** test release-please ([d87cdb1](https://github.com/scottjrainey/cr-bot-sjr/commit/d87cdb125fef71af274425718cdd80f2f4928fa5))
* **versioning:** Update deploy to run on PR merge ([ec06b21](https://github.com/scottjrainey/cr-bot-sjr/commit/ec06b21b83265f9d80cf054906792855715a7f25))
* **versioning:** Update depricated action ([d29896d](https://github.com/scottjrainey/cr-bot-sjr/commit/d29896ddc3fcf481546d2ab5092000c5f9974c89))
* **versioning:** Update logic assign VERSION in release job ([de02370](https://github.com/scottjrainey/cr-bot-sjr/commit/de023706dedcca0c75b2bb475d668683e0d5e357))
* **versioning:** Update to VERSION setting logic in release step ([2ad2537](https://github.com/scottjrainey/cr-bot-sjr/commit/2ad2537120ce0085c2eb63f4aa1aa0234696d372))
* **versioning:** Update version of pnpm in deploy job ([7cd5b68](https://github.com/scottjrainey/cr-bot-sjr/commit/7cd5b689e78b0b2022906f561238485ed05eae16))

## 0.1.0 (2025-06-17)

* chore(cleanup): Remove testing credential 468b1e6
* chore(main): release cr-bot-sjr 0.1.0 5f14b33
* docs(cleanup): README edits 2a91f21
* docs(cleanup): Update README and remove unused docs 245264b
* docs(fix): Use correct prompt names in README 954b45e
* docs(README): Update to include Langfuse in documentation 7a92822
* feat(langfuse): Set up of Langfuse 2c665d4
* ci(GCP): Remove GCP from deployment/release process 41a66c5



## <small>0.0.6 (2025-06-17)</small>

* chore(cleanup): Remove uneeded config file 69ecbd9
* chore(debugger): Cleaned up vscode debugger config aeaad1c
* chore(main): release cr-bot-sjr 0.0.6 07be4ac
* docs(cleanup): Documentation updates and clean up 0e3851f
* docs(README): Updated README c40cf81
* docs(SETUP): Added GitHub app setup instructions 638194f
* ci(code-review): Use 'latest' tag instead of 'main' branch a8790ad
* test(smee): Updated smee script to read webhook proxy url from .env 7b69f41



## <small>0.0.5 (2025-06-17)</small>

* chore(main): release cr-bot-sjr 0.0.5 46eeb9c
* fix: update package description to reflect error handling improvements 6a7be03
* fix(versioning): Added a latest tag d0e3506



## <small>0.0.4 (2025-06-17)</small>

* chore(main): release cr-bot-sjr 0.0.4 8866fca
* fix: Removed unused job from deploy 647c81d
* fix(versioning): Add debugging and VERSION fallback logic to deploy f643872
* fix(versioning): Adjusted container labeling logic in release job cacbf45
* fix(versioning): Change logic for passing ENV vars between jobs 875bca9
* fix(versioning): Debug statements for missing VERSION value in deploy job ca32441
* fix(versioning): Debugging and new logic for tagging in release job 89be3f7
* fix(versioning): Do not rely on release-please output variables 705a2aa
* fix(versioning): Fix to gcr.io container name in deploy job 5216635
* fix(versioning): Update logic assign VERSION in release job de02370
* fix(versioning): Update to VERSION setting logic in release step 2ad2537
* fix(versioning): Update version of pnpm in deploy job 7cd5b68



## <small>0.0.3 (2025-06-17)</small>

* chore(main): release cr-bot-sjr 0.0.3 8f11740
* fix(versioning): Update deploy to run on PR merge ec06b21



## <small>0.0.2 (2025-06-17)</small>

* chore: configure release-please 8d3cd33
* chore: regenerate pnpm lockfile for CI compatibility 2508fd9
* chore(main): release cr-bot-sjr 0.0.2 cdf1bbe
* chore(release): 0.0.1 719883f
* fix: add pull-requests write permission for release-please 674e432
* fix: test release-please debug 3013704
* fix(versioning): Add debug logging to release job 4e5a263
* fix(versioning): Add issues:write permission for release-please d0815a5
* fix(versioning): Fully automate release pipeline 7547fb8
* fix(versioning): Remove skip-github-pull-request: true for debugging d994c73
* fix(versioning): remove unused variabble 'commits' for CI 7c25b11
* fix(versioning): test release-please d87cdb1
* fix(versioning): Update depricated action d29896d
* feat: add enhanced error handling f5f8a3e
* feat: add versioning documentation aeee93c
* feat(versioning): Add versioning support dfb67df
* Add avatar be0b88e
* Add Better error handling for JSON errors in model response 265bf88
* Add SemVer/Conventional Commits scripts for workflow d4487df
* Added .github/ settings file a5cdcc6
* Added a deploy github action 35ba778
* Added biome and fixed several linting issues 782b992
* Added code review workflow 09bd07d
* Added logging of env variables for debugging 74088b0
* Added more robust logging around GH PR submission 013004e
* Basic langchain set up, updated vitest and tests 2c2fc2d
* Conversion (AI led) to container from cloud function ee7ebfe
* Created wrapper to run as Google Cloud Function 6f28dd1
* Extended timeout and added memory in deploy 17dc38b
* Fix to tests and linting with biome enabled 1eda836
* Harden docker container for prod deployment ee415d9
* Initial 'basic-ts' probot skeleton 54ab572
* Removed unused serverless.yml file 180f645
* Switch to MIT License 1cb7a58
* Update tests to recent app changes 0b02c38
* Update to use pnpm instead of npm 99977fa
* Update to use serverless with Google Cloud Function ba1a2e3
