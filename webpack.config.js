const path = require('path')
const webpack = require('webpack')

module.exports = () => {
    const mode = process.env.NODE_ENV || 'production';
    console.info(`build in ${mode} mode.`)
    return {
        entry: './src/index.js',
        mode,
        target: 'web',
        output: {
            filename: 'main.js',
            path: path.resolve(__dirname, 'dist'),
        },
        plugins: [],
        resolve: {
            alias: {
                Utils: path.resolve(__dirname, 'src/utils/'),
                Pages: path.resolve(__dirname, 'src/pages/'),
                Items: path.resolve(__dirname, 'src/items/'),
            }
        }
    };
};
