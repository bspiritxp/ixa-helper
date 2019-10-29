
# Table of Contents

1.  [IXA-Helper](#ixa-helper)
2.  [Getting started](#getting-started)
3.  [Prerequisites](#prerequisites)
4.  [Installing](#installing)
    1.  [Install the vesrion of node being provided (see .nvmrc or .node-version)](#installing--version)
    2.  [Install Yarn](#installing-yarn)
    3.  [Build application](#installing--build-application)
    4.  [Lint](#installing--lint)
5.  [Running the app server](#running-server)
6.  [Built With](#built-with)



<a id="ixa-helper"></a>

# IXA-Helper

NOTE: This file is exported from README.org. Any modifications should also be reflected in that file.


<a id="getting-started"></a>

# Getting started

Following the instructions below to get a copy of this project and running on your local environment for development and testing purpose


<a id="prerequisites"></a>

# Prerequisites

You need:

-   Yarn
-   NodeJS v10.7(nvm/nodenv files provided in repo)


<a id="installing"></a>

# Installing


<a id="installing--version"></a>

## Install the vesrion of node being provided (see .nvmrc or .node-version)

    nvm use

or

    nodenv local

if you use nodenv for version management


<a id="installing-yarn"></a>

## Install Yarn

On MacOS you can run `brew install yarn --ignore-dependencies` to install Yarn, otherwise you can download an installer from [here](http://yarnpkg.com/en/docs/install).
Install dependencies

    yarn install

or

    yarn


<a id="installing--build-application"></a>

## Build application

    yarn build


<a id="installing--lint"></a>

## Lint

    yarn lint

to fix your code smell automatically, try

    yarn lint --fix


<a id="running-server"></a>

# Running the app server

    yarn start

This will start up a local server and listening on port 8080, serving the compiled code from ./dist
[http://127.0.0.1:8080](http://127.0.0.1:8080)
Now use your favorite plugin manager like ViolentMonkey or TamperMonkey(GreaseMonkey if you use firefox), point the URL to be your up running server with path
'/ixa-helper.user.js' it should be automatically recognized as a user script, then head to sengokuixa website and start developing and/or debugging, enjoy!


<a id="built-with"></a>

# Built With

-   NodeJS
-   webpack
-   typescript
-   Yarn

