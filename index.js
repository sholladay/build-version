'use strict';

const path = require('path');
const { exec } = require('child_process');
const username = require('username');
const headHash = require('head-hash');
const readPkgUp = require('read-pkg-up');

const git = (command, option) => {
    const config = Object.assign({}, option);
    return new Promise((resolve, reject) => {
        exec('git ' + command, { cwd : config.cwd }, (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout.trimRight());
        });
    });
};

const isDirty = (option) => {
    return git('status --porcelain', option).then((status) => {
        return status !== '';
    });
};

const getTagVersion = (option) => {
    return git('describe --exact-match HEAD', option).then((tag) => {
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

const suffix = (version, option) => {
    return isDirty(option).then((dirty) => {
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

const buildVersion = (option) => {
    const config = Object.assign({}, option);
    const cwd = path.resolve(config.cwd || '');

    return getTagVersion({ cwd })
        .catch(() => {
            return headHash({
                short : true,
                cwd
            });
        })
        .then(
            (version) => {
                return suffix(version, { cwd });
            },
            () => {
                return readPkgUp({ cwd }).then((data) => {
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
