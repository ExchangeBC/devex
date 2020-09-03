
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![Status](https://github.com/BCDevExchange/assets/blob/master/images/badges/retired.svg)]


# BCDevExchange Application

This was the original web app created by the [BCDevExchange](https://bcdevexchange.org) to facilitate _Code With Us_  and _Sprint With Us_ transactions. 

This product has been superceded by two new products: 

* The **Digital Marketplace** web app ([digital.gov.bc.ca/marketplace](https://digital.gov.bc.ca/marketplace) / [github.com/bcgov/digital_marketplace](https://github.com/bcgov/digital_marketplace)) - where _Code With Us_ and _Sprint With Us_ opportunities can now be found
* The **BCDevExchange website** ([bcdevexchange.org](https://bcdevexchange.org) / [github.com/bcgov/bcdevexchange](https://github.com/bcgov/bcdevexchange)) - which explains the current services offered by the BCDevExchange

***

## Table of Contents

* [Contributing](https://github.com/BCDevExchange/devex#contribute)
* [Development](https://github.com/BCDevExchange/devex#development)
* [Copyright and License](https://github.com/BCDevExchange/devex#copyright-and-license)

***

## Contribute

We are open to pull requests. Please read our [contributing guidelines](https://github.com/BCDevExchange/devex/blob/master/CONTRIBUTING.md). If you are making a pull request, please refer to our [pull request template](https://github.com/BCDevExchange/devex/blob/develop/.github/PULL_REQUEST_TEMPLATE.md).

## Development

### Requirements

Node.js (at least 8.0, but 11+ is recommended)
Global install of `npm` and/or `yarn` modules

### Environment Setup

If you are running the application directly on your machine (not in a container), make a copy of the file `sample.env` at the root of the project, and rename it to `.env`.  Replace the appropriate values in your copied file.  The `.env` file should never be committed to GitHub or shared publicly.

Ensure you fill in appropriate values for the GitHub fields.  This will enable GitHub OAuth in the application.  For more information on how to do this, please refer to https://auth0.com/docs/connections/social/github.  You will need to use http://localhost:3000 for both the Homepage URL and the Authorization callback URL.

If you are running in the Docker container using the `dev.sh` bash script, you will need to update these environment variables in that script instead of creating the `.env` file.

### Launching Devex

To get started, run the following command from the root of the devex directory to set things up the first time:
```bash
$ ./setup.sh
```

This will start a Docker container running mongo and build a new image for the application code.  If you already have an instance of mongo running
then you will likely get errors.  Make sure to shutdown your local mongo instance or run it on a port other than the default 27017.

Once setup has finished you can run the application with:
```bash
$ ./dev.sh
```

This will launch a Docker container and open a terminal into the running container where you can run the containerized application in development mode with:
```bash
$ npm run dev
```

Alternatively, if you do not want to run the application in a docker container, you can install the dependencies locally with:
```bash
$ npm install
```
and then execute `npm run dev` from a terminal on your machine.  If you are running the application outside of the container, ensure you have manually launched the MongoDB Docker container using `docker start db_devex` (the `dev.sh` script will do this for you if you use this method).

Note that if you are running the application locally, you will need to have Node.js 8.0 or higher installed on your machine.

You should now be able to run the application by entering "http://localhost:3000" in your browser.

If you wish to build and run the application in production mode you can do so with:
```bash
$ npm run prod
```

### Notes

When running in development mode, the application will use livereload on port 35729 to automatically load and refresh any changes to client side modules.  `nodemon` is used to automatically transpile and restart the Node server on changes to server side modules.

On some older machines, the livereload option causes performance/overheating issues.  You can still run in development mode without the livereload enabled by using `npm run quiet` instead of `npm run dev`.

By default, the `DEVEX_PROD` environment variable is set to false, and the `MONGO_SEED` environment is set to true.  This will cause local user accounts to be seeded into the database for development purposes.  These accounts have default passwords specified in environment variables (either via `dev.sh` or `.env`).  

If the `DEVEX_PROD` environment variable is set to true, the development accounts will not be seeded.  An admin account will be created and will use the password specified in the `ADMINPW` environment variable.

To use the GitHub OAuth login, you'll need to set up a GitHub Client ID and Secret (see [environment setup](https://github.com/BCDevExchange/devex#environment-setup))

## Copyright and License

Code and documentation copyright 2016-2019 the [BC Developers' Exchange](https://bcdevexchange.org). Code released under the [Apache License, Version 2.0](https://github.com/BCDevExchange/devex/blob/master/LICENSE).
