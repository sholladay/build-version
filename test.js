import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import test from 'ava';
import pify from 'pify';
import rimraf from 'rimraf';
import username from 'username';
import semverRegex from 'semver-regex';
import buildVersion from '.';

const del = (filePath, option) => {
    const config = Object.assign({ glob : false }, option);
    return pify(rimraf)(filePath, config);
};

const git = async (command, option) => {
    const config = Object.assign(
        {
            // Tests will fail in CI without an identity.
            env : {
                GIT_AUTHOR_NAME     : 'Test',
                GIT_AUTHOR_EMAIL    : 'test@example.com',
                GIT_COMMITTER_NAME  : 'Test',
                GIT_COMMITTER_EMAIL : 'test@example.com'
            }
        },
        option
    );
    const stdout = await pify(exec)('git ' + command, config);
    return stdout.trimRight();
};

const initRepo = (cwd) => {
    return git('init --quiet', { cwd });
};

const commit = async (cwd) => {
    const filePath = path.resolve(cwd, 'foo.txt');
    await pify(fs.writeFile)(filePath, 'testing 123');
    await git('add .', { cwd });
    const stdout = await git('commit -m weee --no-verify', { cwd });
    // Return the commit hash.
    return stdout.match(/ [0-9a-f]{7,}(?=])/)[0].trimLeft();
};

const tag = (version, cwd) => {
    return git('tag -a -m hooray ' + version, { cwd });
};

const writePkg = (version, cwd) => {
    const filePath = path.resolve(cwd, 'package.json');
    return pify(fs.writeFile)(filePath, JSON.stringify({ version }));
};

const createTempDir = () => {
    return pify(fs.mkdtemp)(path.join(os.tmpdir(), path.sep));
};

test.beforeEach(async (t) => {
    t.context.tempDir = await createTempDir();
});

test.afterEach((t) => {
    return del(t.context.tempDir);
});

test('buildVersion() basic specification', async (t) => {
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

    // When the working tree is dirty in a git repo, we suffix the version with semver-like
    // "build data", even if it is a commit hash. But if it is semver, then it may already
    // have build data, in which case we need to be careful to not append a second '+'.
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

test('git tag semver', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    await commit(tempDir);
    await tag('v1.2.3', tempDir);

    const version = await buildVersion({ cwd : tempDir });
    t.is(version, '1.2.3');
});

test('git commit hash', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    const hash = await commit(tempDir);

    const version = await buildVersion({ cwd : tempDir });
    t.is(version, hash);
});

test('package.json semver', async (t) => {
    const { tempDir } = t.context;

    await writePkg('2.0.0', tempDir);

    const version = await buildVersion({ cwd : tempDir });
    t.is(version, '2.0.0');
});

test('package.json semver in repo without commit', async (t) => {
    const { tempDir } = t.context;

    await writePkg('2.0.0', tempDir);
    await initRepo();

    const version = await buildVersion({ cwd : tempDir });
    t.is(version, '2.0.0');
});

test('prefer tag over package.json', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    await writePkg('2.0.0', tempDir);
    await commit(tempDir);
    await tag('v1.2.3', tempDir);

    const version = await buildVersion({ cwd : tempDir });
    t.not(version, '2.0.0');
    t.is(version, '1.2.3');
});

test('prefer commit hash over package.json', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    await writePkg('2.0.0', tempDir);
    const hash = await commit(tempDir);

    const version = await buildVersion({ cwd : tempDir });
    t.not(version, '2.0.0');
    t.is(version, hash);
});

test('dirty tag', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    await commit(tempDir);
    await tag('v1.2.3', tempDir);
    await writePkg('2.0.0', tempDir);

    const version = await buildVersion({ cwd : tempDir });
    const user = await username();
    const lastDot = version.lastIndexOf('.');
    const notDate = version.substring(0, lastDot);
    const dateStr = version.substring(lastDot + 1);

    t.true(version.includes(user));
    t.is(notDate, `1.2.3+${user}`);
    t.regex(dateStr, /^\d{8}T\d{6}Z$/);
});

test('dirty commit hash', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);
    const hash = await commit(tempDir);
    await writePkg('2.0.0', tempDir);

    const version = await buildVersion({ cwd : tempDir });
    const user = await username();
    const parts = version.split('.');
    const [notDate, dateStr] = parts;

    t.is(parts.length, 2);
    t.true(version.includes(user));
    t.is(notDate, `${hash}+${user}`);
    t.regex(dateStr, /^\d{8}T\d{6}Z$/);
});

test('throw when no package or repo exists', async (t) => {
    const err = await t.throws(buildVersion({ cwd : t.context.tempDir }), TypeError);
    t.is(err.message, 'Unable to determine a build version.');
});

test('throw when no package or commit exists', async (t) => {
    const { tempDir } = t.context;

    await initRepo(tempDir);

    const err = await t.throws(buildVersion({ cwd : tempDir }), TypeError);
    t.is(err.message, 'Unable to determine a build version.');
});
