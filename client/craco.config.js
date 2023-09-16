// https://stackoverflow.com/questions/44114436/the-create-react-app-imports-restriction-outside-of-src-directory/68017931#68017931
// https://stackoverflow.com/questions/44114436/the-create-react-app-imports-restriction-outside-of-src-directory/60353355#60353355

const path = require("path");
const enableImportsFromExternalPaths = require("./enableImportsFromExternalPaths");

const sharedLibOne = path.resolve(__dirname, "../shared");

module.exports = {
    webpack: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            shared: path.resolve(__dirname, "../shared"),
        },
    },
    plugins: [
        {
            plugin: {
                overrideWebpackConfig: ({ webpackConfig }) => {
                    enableImportsFromExternalPaths(webpackConfig, [
                        // Add the paths here
                        sharedLibOne,
                    ]);
                    return webpackConfig;
                },
            },
        },
    ],
};
