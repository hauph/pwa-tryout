const path = require('path');
const { merge } = require('webpack-merge');
const { OpenBrowserOncePlugin } = require('open-browser-once-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');
const childProcess = require('child_process');
const process = require('process');

const patternFactory = require('./patterns');
const common = require('./webpack.common.js');

let additionalPlugins = [];

const isPWA = process.env.ENV === 'pwa';
if (isPWA) {
  additionalPlugins = [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [path.resolve('.', 'build')],
    }),
    new CopyPlugin({
      patterns: patternFactory(process.env.ENV),
    }),
    new BrowserSyncPlugin(
      {
        host: 'localhost',
        port: 5002,
        ghostMode: false,
        server: {
          baseDir: [path.resolve('.', 'build')],
        },
        open: false,
        injectChanges: true,
        files: [
          'src/',
          {
            match: [
              'src/*.html',
              'src/pages/*.html',
              'src/pages/**/*.html',
              'src/styles/**/*.css',
              'src/scripts/global-plugin-list.json',
            ],
            fn(event, file) {
              /** Custom event handler * */
              childProcess.exec('npm run build', (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  process.exit();
                }
                console.log('command passed!');
              });
              const bs = require('browser-sync').get('bs-webpack-plugin');
              bs.reload();
            },
          },
        ],
      },
      {
        injectCss: true,
      },
    ),
  ];
}

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: path.resolve('.', 'src'), // source of static assets
    port: 1802, // port to run dev-server
    hot: true, // hot reload
  },
  plugins: [
    new ESLintPlugin({}),
    new StylelintPlugin({ fix: true }),
    new WebpackNotifierPlugin({ onlyOnError: true }),
    ...additionalPlugins,
  ],
});
