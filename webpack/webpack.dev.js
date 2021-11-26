const path = require('path');
const { merge } = require('webpack-merge');
const { OpenBrowserOncePlugin } = require('open-browser-once-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const IfPlugin = require('if-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');
const childProcess = require('child_process');
const process = require('process');

const patternFactory = require('./patterns');
const common = require('./webpack.common.js');

const isPWA = process.env.ENV === 'pwa';

// Create patterns for CopyPlugin
const patterns = isPWA ? patternFactory(process.env.ENV) : [];

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
    // new OpenBrowserOncePlugin('http://localhost:1802'),
    new IfPlugin(
      isPWA,
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [path.resolve('.', 'build')],
      }),
    ),
    new IfPlugin(
      isPWA,
      new CopyPlugin({
        patterns,
      }),
    ),
    new IfPlugin(
      isPWA,
      new BrowserSyncPlugin(
        {
          host: 'localhost',
          port: 5001,
          ghostMode: false,
          server: {
            baseDir: [path.resolve('.', 'build')],
          },
          open: false,
          files: [
            'src/',
            {
              match: [
                'src/pages/*.html',
                'src/pages/**/*.html',
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
              },
            },
          ],
        },
        {
          injectCss: true,
        },
      ),
    ),
  ],
});
