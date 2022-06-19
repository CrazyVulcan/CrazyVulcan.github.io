FND's ESLint configuration

[![Greenkeeper badge](https://badges.greenkeeper.io/FND/eslint-config.svg)](https://greenkeeper.io)


Getting Started
---------------

* install this package:

        $ npm install --save-dev eslint-config-fnd

* create a file `.eslintrc` with the following contents:

        extends: fnd

  alternatively, use `package.json`:

        "eslintConfig": {
            "extends": "fnd"
        }

* run ESLint on your source files and directories:

        $ eslint --cache *.js src

* optionally adopt this repository's [`.editorconfig`](http://editorconfig.org)
