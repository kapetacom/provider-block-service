const Path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'blocks.blockware.com/v1/Service': Path.resolve(__dirname, "./src/web")
    },
    output: {
        path: Path.join(process.cwd(), 'web'),
        filename: '[name].js',
        library: `Blockware.blockTypes["[name]"]`,
        libraryTarget: 'assign'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        "@babel/env",
                        "@babel/typescript",
                        "@babel/react"
                    ],
                    plugins: [
                        ["@babel/plugin-proposal-decorators", {legacy: true}],
                        ["@babel/plugin-proposal-private-methods", { "loose": true }],
                        ["@babel/plugin-proposal-private-property-in-object", {"loose": true}],

                        [
                            "@babel/plugin-proposal-class-properties", {loose: true}
                        ],
                        "@babel/proposal-object-rest-spread"
                    ]
                }
            },
            {
                test: /\.less$/,
                use: ["style-loader", "css-loader", "less-loader"],
                include: Path.resolve(__dirname, "./")
            },
            {
                test: /\.ya?ml$/,
                use: ['json-loader', 'yaml-loader'],
                include: Path.resolve(__dirname, "./")
            }
        ]
    },
    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx',
            '.less',
            '.yml',
            '.yaml'
        ]
    },
    externals: {
        react: 'React',
        lodash: '_',
        'react-dom': 'ReactDom',
        'mobx-react': 'MobXReact',
        'mobx': 'MobX',
        '@blockware/ui-web-components': 'Blockware.Components',
        '@blockware/ui-web-types': 'Blockware.Types',
        '@blockware/ui-web-utils': 'Blockware.Utils',
        '@blockware/ui-web-context': 'Blockware.Context'
    }
};