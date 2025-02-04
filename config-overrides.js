const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    "crypto": require.resolve("crypto-browserify"),
    "querystring": require.resolve("querystring-es3"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "timers": require.resolve("timers-browserify"),
    "vm": require.resolve("vm-browserify")
  };

  config.plugins = [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    ...config.plugins
  ];

  return config;
};
