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
<img width="805" alt="image" src="https://user-images.githubusercontent.com/96681520/217475318-0d3d93e8-9105-490a-9518-7ce8cfd05b28.png">

Currently, automatic run from _TeamCity_ will run all the tests.

> Some of the tests require a precondition account and therefor expected to pass only in production and staging.

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

> To configure the target the tests will run on (review/preview/prod..), account and more, use the `[.env](https://github.com/QualiNext/qa-automation/blob/bf48ff25fdd7105ab0e74e31e3ee216e388075f4/.env)` file.

```
1. Login to AWS CLI (needed for agent deployment)
2. “npx playwright test< folder tests name>” - to run all the tests
3. “npx playwright test <test name>” - to run a specific test
4. “npx playwright test <test name> --headed” - to run a specific UI test in headed 5. mode (see the actual UI test), not relevant for API tests
6. “npx playwright test <test name> --debug” - to run a specific UI test in debug mode, not relevant for API tests
```

## Reports
Tests report is currently only in xml and available in TeamCity or in the playwright console (printed to std-out when run from console).

**UI tests:**
Playwright UI reports consist of the Playwright error, therefor in many cases they must be reviewed with the code to learn the actual error.

In most cases the error indicates that a button was not visible or cannot be used, this error usually results from UI changers or actual bugs.

In order to learn the actual root-cause, the tests and flow must be investigated.

**API tests:**
In the case of API tests, the API response error is printed to the console.

## References 

Blueprints repositories:
* [GitHub - cloudshell-colony/qa_automation](https://github.com/cloudshell-colony/qa_automation)
* [GitHub - QualiNext/test-spec2-public](https://github.com/QualiNext/test-spec2-public)
* [GitHub - QualiNext/torque-demo](https://github.com/QualiNext/torque-demo)
* [GitHub - QualiNext/qa-bp-validation](https://github.com/QualiNext/qa-bp-validation)

## Contributing

If you would like to contribute to the repository, please feel free to submit a pull request. Please make sure to include a detailed description of your changes and any resources needed to test the changes.

## Support

If you need help using the repository, please feel free to contact us. We'll be happy to answer any questions you may have and provide assistance.
