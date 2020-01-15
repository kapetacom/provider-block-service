module.exports = {
    webpackFinal: config => {
        const parentConfig = require('../webpack.config');
        config.module.rules =
            config.module.rules.concat(parentConfig.module.rules);

        config.resolve.extensions =
            config.resolve.extensions.concat(parentConfig.resolve.extensions);

        return config;
    },
    stories: ['../stories/**/*.stories.tsx'],
    addons: ['@storybook/addon-actions', '@storybook/addon-links'],
};
