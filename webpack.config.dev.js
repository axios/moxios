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
  entry: './src/index.js',
  output: {
    filename: './dist/bundle.js'
  },
  devtool: 'eval-source-map',
  watch: true,
  externals: {
    'axios': 'axios'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['add-module-exports']
        }
      }
    ]
  }
}
