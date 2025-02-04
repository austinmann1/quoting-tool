const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "querystring": require.resolve("querystring-es3"),
          "buffer": require.resolve("buffer/"),
          "url": require.resolve("url/"),
          "stream": require.resolve("stream-browserify"),
          "http": require.resolve("stream-http"),
          "https": require.resolve("https-browserify"),
          "zlib": require.resolve("browserify-zlib"),
          "path": require.resolve("path-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "util": require.resolve("util/"),
          "timers": require.resolve("timers-browserify"),
          "process": require.resolve("process/browser"),
          "fs": false,
          "net": false,
          "tls": false
        }
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ]
    }
  }
};
