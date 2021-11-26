# Static Web Boilerplate

Simple boilerplate for developing static HTML projects using `Webpack`, `SCSS`. It is also configured with `nodemon`, `webpack-dev-server`, `eslint`, `prettier`, `stylelint` and `babel`.

## Installation

1. Clone source code.
2. Run `npm install` (or `npm i`).
3. Run `npm run makedir` to install missing folders (src/fonts, src/images, src/pages, src/plugins). These folders are missing because Git ignores empty directories. (See the [Git FAQ](https://git.wiki.kernel.org/index.php/GitFaq#Can_I_add_empty_directories.3F))
  
## Folder Structure

```bash
.
├── /build/                             # All the built files and folders which are used for production will go here
├── /node_modules/                      # 3rd-party libraries and utilities installed via npm
├── /src/                               # The source code of the application
│   ├── /fonts/                         # Fonts
│   ├── /images/                        # Images
│   ├── /pages/                         # HTML files (no folders allowed)
│   ├── /plugins/                       # 3rd-party libraries and utilities downloaded and added to HTML file via link and script tags
│   ├── /scripts/                       # Javascript
│   │   ├── /style-script/            
│   │   │   ├── style-script.js         # Main CSS and SCSS used in project
│   │   ├── global-plugin-list.json     # List of CSS and JS links that are used on all pages
│   │   ├── index.js                    # Main JS file
│   ├── styles  
│   │   ├── /css/                     
│   │   │   ├── css.css                 # Main CSS file (in case you want to use CSS)
│   │   ├── /scss/                      # Source of your SCSS files
│   │   │   ├── style.scss              # Main SCSS file
│   ├── index.html                      # Main page
├── /webpack/
│   ├── webpack.common.js               # Webpack configuration which is used on both development and production modes
│   ├── webpack.dev.js                  # Webpack configuration for development mode
│   ├── webpack.prod.js                 # Webpack configuration for production mode
├── .babelrc                            # Babel configuration
├── .editorconfig                       # Editor configuration
├── .eslintrc.json                      # Es-lint configuration
├── .gitignore                          # Ignored git files and folders
├── .prettierignore                     # Ignored prettier files and folders
├── .prettierrc                         # Prettier configuration
├── .stylelintrc                        # Stylelint configuration
├── package.json                        # The list of 3rd party libraries and utilities
├── README.md                           # This file
```

## Documentation

- All the source code will be inside **src** directory.
- This boilerplate supports multiple pages. To use this, create your page (**html** file) inside **pages** folder. Please note that this boilerplate does not support nested HTML pages, so folders created inside **pages** are prohibited.
- There are 2 ways to add external links and scripts:
  - Particular: add link and script tags to page you want. This is the classic way and added links and scripts will only work within that page.
  - Globally: add links of CSS and JS to file `global-plugin-list.json`. Added links will be imported to all pages.
  
    ```json
      // Example
      {
          "css": [
              "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
          ],
          "js": [
              "https://code.jquery.com/jquery-3.6.0.slim.min.js",
              "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js",
              "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"
          ]
      }
    ```

## Usage

- `npm run makedir` or `npm run mkdir`: Install missing folders (src/fonts, src/ images, src/pages, src/plugins).
- `npm run start` or `npm start`: Start development server, open http://localhost:1802.
- `npm run build`: Build **src** and create **build** folder for production.
- `npm run start:prod`: Build **src** and create **build** folder for production, then start production server on http://localhost:5001. This will show you how your project looks like on a real server.

## VSCode + ESLint + Prettier

[VSCode](https://code.visualstudio.com/) is a lightweight but powerful source code editor. [ESLint](https://eslint.org/) takes care of the code-quality. [Prettier](https://prettier.io/) takes care of all the formatting.

1. Install [VSCode](https://code.visualstudio.com/Download)
2. Install [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
3. Install [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Note

1. Run `npm run mkdir` instead if `npm run makedir` does not work on your computer. If `npm run mkdir` still does not work, please manually create 4 folders **fonts**, **images**, **pages**, **plugins** (*to make sure you can also create a placeholder file `.gitkeep` in each folder*) to **src** folder.
2. In case you have problem when switching between Git branches, it may be because you are missing 4 folders  **fonts**, **images**, **pages**, **plugins** in **src** folder. Please follow this note's point 1 to fix it.
3. If you keep seeing `prettier` warnings, it may be because `eslint` auto fix has not worked yet. To enable `eslint` auto fix, please open VS Code's `settings.json` and add the following lines of code:

    ``` json
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
    ```

    (*Also make sure you have installed Eslint and Prettier extensions*)
