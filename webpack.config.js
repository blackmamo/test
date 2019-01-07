TOOO DELTE

const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
//    delete: "./src/delete.js",
//    get: "./src/get.js",
    upsert: "./src/upsert.js"
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/env"],
          //plugins: [ 'source-map-support', 'babel-plugin-rewire' ]
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
    {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
    }]
  },
  resolve: {
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules')
    ],
    extensions: ["*", ".js", ".jsx"]
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
    publicPath: "/dist/",
    filename: "[name].js"
  },
  //target:"node",
  externals: {
    "aws-sdk": "aws-sdk"
  }
};