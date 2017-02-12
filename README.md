# build-version [![Build status for build-version](https://img.shields.io/circleci/project/sholladay/build-version/master.svg "Build Status")](https://circleci.com/gh/sholladay/build-version "Builds")

> Get a version for your build

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
    // '1.0.0'
});
```

## API

### buildVersion(option)

Returns a `Promise` for the first successful of the following:

1. A release tag, if the most recent commit is a release.
2. The short hash of the most recent commit.
3. The version from package.json, if not in a git repository.

If in a git repository and the working directory is dirty, the username and date are appended to the version. This makes dirty versions stand out and provides useful context for what might be different about the build.

For example: `1.0.0+sholladay.20161022T095547Z` or `a420250+sholladay.20161022T095547Z`

#### option

Type: `object`

##### cwd

Type: `string`<br>
Default: `process.cwd()`

Parent directory of the build root.

## Related

 - [delivr](https://github.com/sholladay/delivr) - Build your code and ship it to [S3](https://aws.amazon.com/s3/)
 - [build-files](https://github.com/sholladay/build-files) - Read the files from your build
 - [build-keys](https://github.com/sholladay/build-keys) - Get the paths of files from your build
 - [build-dir](https://github.com/sholladay/build-dir) - Get a place to put your build
 - [build-data](https://github.com/sholladay/build-data) - Get metadata for your build
 - [build-path](https://github.com/sholladay/build-path) - Get a path for the given build
 - [branch-name](https://github.com/sholladay/branch-name) - Get the current branch name

## Contributing

See our [contributing guidelines](https://github.com/sholladay/build-version/blob/master/CONTRIBUTING.md "Guidelines for participating in this project") for more details.

1. [Fork it](https://github.com/sholladay/build-version/fork).
2. Make a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. [Submit a pull request](https://github.com/sholladay/build-version/compare "Submit code to this project for review.").

## License

[MPL-2.0](https://github.com/sholladay/build-version/blob/master/LICENSE "License for build-version") © [Seth Holladay](https://seth-holladay.com "Author of build-version")

Go make something, dang it.
