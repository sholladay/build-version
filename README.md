# build-version [![Build status for build-version on Circle CI.](https://img.shields.io/circleci/project/sholladay/build-version/master.svg "Circle Build Status")](https://circleci.com/gh/sholladay/build-version "Build Version Builds")

> Get a version for your build.

## Why?

 - Versioning your builds improves integrity.
 - Ensures your build numbers are useful and meaningful.
 - Intelligent behavior in or out of a repository.

## Install

```sh
npm install build-version --save
```

## Usage

Get it into your program.

```js
const buildVersion = require('build-version');
```

Get a version to use when writing the build.

```js
buildVersion().then((version) => {
    console.log(version);
});
```

## Contributing

See our [contributing guidelines](https://github.com/sholladay/build-version/blob/master/CONTRIBUTING.md "The guidelines for participating in this project.") for more details.

1. [Fork it](https://github.com/sholladay/build-version/fork).
2. Make a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. [Submit a pull request](https://github.com/sholladay/build-version/compare "Submit code to this project for review.").

## License

[MPL-2.0](https://github.com/sholladay/build-version/blob/master/LICENSE "The license for build-version.") © [Seth Holladay](http://seth-holladay.com "Author of build-version.")

Go make something, dang it.
