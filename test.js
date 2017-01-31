import path from 'path';
import os from 'os';
import fs from 'fs';
import test from 'ava';
import semverRegex from 'semver-regex';
import buildVersion from '.';

const createTempDir = () => {
    return new Promise((resolve, reject) => {
        fs.mkdtemp(path.join(os.tmpdir(), path.sep), (err, dirPath) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(dirPath);
        });
    });
};

test.beforeEach(async (t) => {
    t.context.tempDir = await createTempDir();
});

test.afterEach((t) => {
    return new Promise((resolve, reject) => {
        fs.rmdir(t.context.tempDir, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
});

test('buildVersion() is a simple string', async (t) => {
    const version = await buildVersion();
    t.is(typeof version, 'string');
    // Must be at least as long as the shortest valid semver. Commit hashes are longer.
    t.true(version.length >= '0.0.0'.length);
    // 'v' is a common tag prefix that we strip and it is invalid in a
    // commit hash or at the start of a semver version.
    t.false(version.startsWith('v'));
    t.regex(version, /^[0-9a-f]/);

    const isFromHash = /^[0-9a-f]{7,}(?:\+|$)/.test(version);
    const isFromSemver = semverRegex().test(version);
    t.true(isFromHash || isFromSemver);

    // Correctly suffix semver versions that already have build data.
    const numPlusSigns = (version.match(/\+/g) || []).length;
    t.true(numPlusSigns === 0 || numPlusSigns === 1);

    if (version.includes('+')) {
        const numDots = (version.match(/\./g) || []).length;
        if (isFromHash) {
            t.is(numDots, 1);
        }
        else {
            t.true(numDots > 1);
        }
    }
});

test('throws when not given enough input', async (t) => {
    const err = await t.throws(buildVersion({ cwd : t.context.tempDir }), TypeError);
    t.is(err.message, 'Unable to determine a build version.');
});

// test.todo('cwd option');

// test.todo('prefers tags to commits');
// test.todo('prefers commits to package version');
// test.todo('uses package version when there is no tag/commit');
// test.todo('throws when there is no tag/commit or package version');
