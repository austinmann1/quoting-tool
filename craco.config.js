const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
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
          "crypto": require.resolve("crypto-browserify"),
          "assert": require.resolve("assert/"),
          "zlib": require.resolve("browserify-zlib")
        }
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      ]
    }
  }
};
