const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      'fs': false,
      'path': false,
      'crypto': false,
    }
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          { loader: 'ts-loader' }
        ]
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      }
    ]
  },
  plugins: [
    // Copy ONNX Runtime WASM files to dist
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/onnxruntime-web/dist/*.wasm',
          to: '[name][ext]'
        },
      ],
    }),
  ],
};
