const path = require('path');

module.exports = {
  entry: {
      "content-script": './src/content-script.ts',
      "background": './src/background.ts'
  },
  mode: 'development',
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
   clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          // [style-loader](/loaders/style-loader)
          { loader: 'ts-loader' }
          // [css-loader](/loaders/css-loader
        ]
      }
    ]
  }
};
