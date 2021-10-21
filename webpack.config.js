var webpack = require("webpack"),
  path = require("path"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin");

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    background: path.join(__dirname, "src", "js", "background.js"),
    content: path.join(__dirname, "src", "js", "content.js"),
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js",
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin({ NODE_ENV: "development" }),
    new CopyWebpackPlugin({
      patterns: [{ from: "src/manifest.json", to: "manifest.json" }],
    }),
    new WriteFilePlugin(),
  ],
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;
