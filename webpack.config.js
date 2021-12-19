const path = require('path');

module.exports = {
  entry: './src/content-script.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'content-script.js',
  },
};