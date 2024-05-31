const { defaults } = require('jest-config');

/** @type {import('jest').Config} */
const config = {
    rootDir: __dirname,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

module.exports = config;