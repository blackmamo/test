const path = require('path');
const webpack = require('webpack');

// TODO Need to modify the build to do better at e.g. minifying code in prod
module.exports =  {
  entry: {
    delete: './src/delete.js',
    get: './src/get.js',
    upsert: './src/upsert.js'
  },
  mode: 'production',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules')
    ],
    extensions: ['.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/dist/',
    filename: '[name].js'
  },
  target:'node',
  externals: {
    'aws-sdk': 'aws-sdk'
  }
}