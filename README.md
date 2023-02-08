# qa-automation

This repository contains the code and resources to run Torque E2E tests.

Torque automation contains a set of tests which aim to cover basic flows expected from new and existing customers.

## Description

This repository is a collection of code, scripts, and resources that runs API and UI tests. 

This repository is designed to provide an easy way for developers and automation eng. to run and extend E2E tests.

The tests are executed via our CI/CD in _TeamCity_ (soon _Github Actions_) Torque / BackEnd / Testing / E2E > Overview — TeamCity (quali.com)

The automation tests are written in JavaScript using Playwright.


## Usage

### TeamCity

The tests are running daily at `19:30` and with each update of the staging Torque environment.

The tests can also be triggered from _TeamCity_ on production, staging and every other environment like the teams review environments by setting the environment name in the TeamCity job:
blob:https://quali.atlassian.net/e8bcfa5b-05aa-4d7c-aa37-e1762a7a2771#media-blob-url=true&id=2e65b392-0fc3-4172-8db8-373deec43d0a&contextId=2779185197&collection=contentId-2779185197

Currently, automatic run from _TeamCity_ will run all the tests.

:::tip note
Some of the tests require a precondition account and therefor expected to pass only in production and staging.
:::

### Manual execution

The tests can easily be used by pulling the tests repo and installing the dependencies.

**Pre-reqs:**

``` 
1. Install NodeJS
2. Install AWS CLI (needed for agent deployment)
3. Clone the repository (link below)
4. Enter qa-automation folder
5. Run “npm install --playwright”
```

**Running the tests:**

```
1. Login to AWS CLI (needed for agent deployment)
2. “npx playwright test< folder tests name>” - to run all the tests
3. “npx playwright test <test name>” - to run a specific test
4. “npx playwright test <test name> --headed” - to run a specific UI test in headed 5. mode (see the actual UI test), not relevant for API tests
6. “npx playwright test <test name> --debug” - to run a specific UI test in debug mode, not relevant for API tests
```

## Contributing

If you would like to contribute to the repository, please feel free to submit a pull request. Please make sure to include a detailed description of your changes and any resources needed to test the changes.

## Support

If you need help using the repository, please feel free to contact us. We'll be happy to answer any questions you may have and provide assistance.
