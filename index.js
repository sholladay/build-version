'use strict';

const { promisify } = require('util');
const path = require('path');
const childProcess = require('child_process');
const username = require('username');
const headHash = require('head-hash');
const readPkgUp = require('read-pkg-up');

const exec = promisify(childProcess.exec);

const git = async (command, option) => {
    const { cwd } = Object.assign({}, option);
    const { stdout } = await exec('git ' + command, { cwd });
    return stdout.trimRight();
};

const isDirty = async (option) => {
    const status = await git('status --porcelain', option);
    return status !== '';
};

const getTagVersion = async (option) => {
    const tag = await git('describe --exact-match HEAD', option);
    const prefix = 'v';
    return tag.startsWith(prefix) ? tag.substring(prefix.length) : tag;
};

// An ISO 8601 date that is safe to use in a semver string, i.e. it does not need
// to be escaped. We use the compact syntax, without milliseconds, to avoid the
// dot separators that have special meaning to semver.
const semverDate = () => {
    const pad = (number) => {
        return number > 9 ? number : '0' + number;
    };

    const date = new Date();

    // We need to humanize the month, as getUTCMonth is a zero-based number,
    // unlike the others.
    return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate()),
        'T',
        pad(date.getUTCHours()),
        pad(date.getUTCMinutes()),
        pad(date.getUTCSeconds()),
        'Z'
    ].join('');
};

// Help identify dirty builds, those that differ from the latest commit.
// If the working directory is dirty, append the username and date to
// the version string, to make it stand out.
const suffix = async (version, option) => {
    const dirty = await isDirty(option);
    if (!dirty) {
        return version;
    }
    const name = await username();
    const startMarker = '+';
    const fieldSeparator = '.';
    const prefix = version.includes(startMarker) ? fieldSeparator : startMarker;
    // Attach or append to "build data", as defined by semver.
    return version + prefix + name + fieldSeparator + semverDate();
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
            async () => {
                const data = await readPkgUp({ cwd });
                if (data && data.pkg && data.pkg.version) {
                    return data.pkg.version;
                }
                throw new TypeError('Unable to determine a build version.');
            }
        );
};

module.exports = buildVersion;
