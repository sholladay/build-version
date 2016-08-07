'use strict';

const readPkgUp = require('read-pkg-up');
const headHash = require('head-hash');

const buildVersion = () => {
    return headHash().catch(() => {
        return readPkgUp().then((data) => {
            if (data && data.pkg && data.pkg.version) {
                return data.pkg.version;
            }
            throw new TypeError(
                'Unable to determine a build version.'
            );
        });
    });
};

module.exports = buildVersion;
