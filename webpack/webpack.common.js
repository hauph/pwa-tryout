const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const fs = require('fs');

// Prepare list of CDN plugins in array 'tags'
let links = [];
let scripts = [];
const globalPluginList = JSON.parse(
  fs.readFileSync(
    path.resolve('.', 'src/scripts/global-plugin-list.json'),
    'utf8',
  ),
);
links = globalPluginList.css;
scripts = globalPluginList.js;

// Prepare plugins
const plugins = [
  new MiniCssExtractPlugin({
    filename: './style/main.css?v=[contenthash]',
  }),
  // This magical plugin will add CSS or JS links from CDN to HTML pages
  new HtmlWebpackTagsPlugin({
    links,
    scripts,
    append: false,
    usePublicPath: false,
  }),
  new HtmlWebpackPlugin({
    template: 'src/index.html',
    inject: 'body',
    filename: 'index.html',
    minify: {
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  }),
];

// Create more HtmlWebpackPlugin instances
const files = fs.readdirSync(path.resolve('.', 'src/pages'), 'utf8');
files.forEach((file) => {
  try {
    // Case 1: html files in 'pages' folder
    const fileContent = fs.readFileSync(
      path.resolve('.', `src/pages/${file}`),
      'utf8',
    );
    if (fileContent.length) {
      const page = new HtmlWebpackPlugin({
        template: `src/pages/${file}`,
        inject: 'body',
        filename: `pages/${file}`,
        minify: {
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      });
      plugins.push(page);
    }
  } catch (err) {
    // Case 2: folder/*.html in 'pages' folder
    const subfiles = fs.readdirSync(
      path.resolve('.', `src/pages/${file}`),
      'utf8',
    );
    subfiles.forEach((f) => {
      const fileContent = fs.readFileSync(
        path.resolve('.', `src/pages/${file}/${f}`),
        'utf8',
      );
      if (fileContent.length) {
        const page = new HtmlWebpackPlugin({
          template: `src/pages/${file}/${f}`,
          inject: 'body',
          filename: `pages/${file}/${f}`,
          minify: {
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        });
        plugins.push(page);
      }
    });
  }
});
module.exports = {
  entry: './src/scripts/index.js',
  output: {
    path: path.resolve('.', 'build'),
    filename: './js/main.js?v=[contenthash]',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: [/node_modules/],
      },
      {
        test: /\.(s?css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-hot-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: ['autoprefixer'],
              },
            },
          },
          'sass-loader',
          'import-glob-loader',
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg|woff|eot|ttf|woff2)$/,
        type: 'asset/inline',
      },
      {
        test: /\.html$/i,
        loader: 'html-loader', // export HTML as string. HTML is minimized when the compiler demands.
        options: {
          sources: false,
        },
      },
    ],
  },
  plugins,
};
