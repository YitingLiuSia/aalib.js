const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: path.resolve(__dirname, "main.js"),
    output: {
        path: __dirname,
        publicPath: path.basename(__dirname) + "/",
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    devtool: "eval-source-map", // Better for development
    resolve: {
        extensions: [".js"]
    }
};

if (process.env.NODE_ENV === "production") {
    module.exports.devtool = "source-map"; // More appropriate for production
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ]);
}