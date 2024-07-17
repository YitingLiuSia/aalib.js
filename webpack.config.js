const webpack = require("webpack");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    mode:  'production',
    entry: "./src/index.js",
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        library: "aalib",
        filename: "aalib.js"
    },

    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },

    plugins: [
        // new webpack.optimize.UglifyJsPlugin({ minimize: true }),
        new webpack.BannerPlugin(require("fs").readFileSync("LICENSE", { encoding: "utf8" }))
    ], 
    
   

    devtool: "source-map"
};