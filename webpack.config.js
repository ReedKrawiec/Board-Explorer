const path = require('path');

module.exports = {
  entry: './src/content-script.ts',
  mode: 'production',
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, 'dist'),
   clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          // [style-loader](/loaders/style-loader)
          { loader: 'awesome-typescript-loader' }
          // [css-loader](/loaders/css-loader
        ]
      }
    ]
  }
};