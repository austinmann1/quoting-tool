const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add minimal polyfills for node modules
  config.resolve.fallback = {
    "stream": require.resolve("stream-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url/"),
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "util": require.resolve("util/"),
    "querystring": require.resolve("querystring-es3"),
    "crypto": require.resolve("crypto-browserify")
  };

  // Add essential providers
  config.plugins = [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    ...config.plugins
  ];

  return config;
};
