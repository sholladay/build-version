'use strict';

// TODO: First attempt to return the version from a release tag.
// git describe --exact-match --dirty="+dirty"
const { exec } = require('child_process');
const username = require('username');
const headHash = require('head-hash');
const readPkgUp = require('read-pkg-up');

const git = (cmd) => {
    return new Promise((resolve, reject) => {
        exec('git ' + cmd, (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout.trimRight());
        });
    });
};

const isDirty = () => {
    return git('status --porcelain').then((status) => {
        return status !== '';
    });
};

const getTagVersion = () => {
    return git('describe --exact-match HEAD').then((tag) => {
        const prefix = 'v';
        if (tag.startsWith(prefix)) {
            return tag.substring(prefix.length);
        }
        return tag;
    });
};

// An ISO 8601 date that is semver compliant. Compact syntax, without milliseconds.
const semverDate = () => {
    const pad = (number) => {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    };

    const date = new Date();

    return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate())
    ].join('') + 'T' + [
        pad(date.getUTCHours()),
        pad(date.getUTCMinutes()),
        pad(date.getUTCSeconds())
    ].join('') + 'Z';
};

const suffix = (version) => {
    return isDirty().then((dirty) => {
        if (!dirty) {
            return version;
        }
        return username().then((name) => {
            const buildDataStart = '+';
            const buildDataSeparator = '.';
            const prefix = version.includes(buildDataStart) ? buildDataSeparator : buildDataStart;
            const data = name + buildDataSeparator + semverDate();
            // We attach or append to "build data" as defined by semver.
            return version + prefix + data;
        });
    });
};

const buildVersion = () => {
    return getTagVersion()
        .catch(() => {
            return headHash({ short : true });
        })
        .then(
            suffix,
            () => {
                return readPkgUp().then((data) => {
                    if (data && data.pkg && data.pkg.version) {
                        return data.pkg.version;
                    }
                    throw new TypeError(
                        'Unable to determine a build version.'
                    );
                });
            }
        );
};

module.exports = buildVersion;
