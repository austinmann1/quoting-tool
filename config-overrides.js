const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add polyfills for node modules
  config.resolve.fallback = {
    "vm": require.resolve("vm-browserify"),  // Prioritize vm polyfill
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url/"),
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "querystring": require.resolve("querystring-es3"),
    "timers": require.resolve("timers-browserify"),
    "zlib": require.resolve("browserify-zlib")
  };

  // Add providers early in the plugin chain
  const newPlugins = [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      vm: 'vm-browserify'
    })
  ];

  config.plugins = [...newPlugins, ...config.plugins];

  // Ensure modules can resolve node core modules
  config.resolve.modules = ['node_modules', ...config.resolve.modules || []];
  config.resolve.fallback = config.resolve.fallback || {};

  return config;
};
