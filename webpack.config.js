var webpack = require('webpack')
var fileName = require('./package').name
var plugins = []

if (process.env.MINIFY) {
  fileName += '.min'
  plugins.push(
    new webpack.optimize.UglifyJsPlugin()
  )
}

module.exports = {
  entry: './index.js',
  output: {
    filename: 'dist/' + fileName + '.js',
    library: 'moxios',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
