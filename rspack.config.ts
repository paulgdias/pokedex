const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { TsCheckerRspackPlugin } = require("ts-checker-rspack-plugin");

const plugins = [
    new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.svg",
    }),
    new TsCheckerRspackPlugin(),
];

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
        filename: "[name].[contenthash].js",
        chunkFilename: "[id].[chunkhash].js",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "builtin:swc-loader",
                        options: {
                            jsc: {
                                parser: {
                                    syntax: "typescript",
                                    tsx: true,
                                },
                                transform: {
                                    react: {
                                        runtime: "automatic",
                                        development: false,
                                        refresh: false,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ["postcss-loader"],
                type: "css",
            },
        ],
    },
    plugins,
    experiments: {
        css: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js"],
        alias: {
            "@api": path.resolve(__dirname, "src/api"),
            "@components": path.resolve(__dirname, "src/components"),
            "@styles": path.resolve(__dirname, "src/styles"),
            "@customTypes": path.resolve(__dirname, "src/types"),
            "@utils": path.resolve(__dirname, "src/utils"),
        },
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        port: 3000,
        historyApiFallback: true,
        hot: true,
        client: {
            overlay: false,
        },
        liveReload: true,
        compress: true,
    },
    optimization: {
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                // rarely changes, so it stays cached across app deploys
                framework: {
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
                    name: "framework",
                    priority: 20,
                    enforce: true,
                },
            },
        },
    },
    // a regression alarm rather than the 244 KiB default, which the framework
    // alone (react-dom + react-router) already exceeds
    performance: {
        maxEntrypointSize: 600_000,
        maxAssetSize: 420_000,
    },
};
