const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const nodeExternals = require('webpack-node-externals');

let mode = 'production';
if (process.env.NODE_ENV === 'development') {
  mode='development';
}

const browserConfig = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'publicbuild'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  mode: mode,
  module: {
    rules: [
      { test: /\.(js)$/, use: 'babel-loader' },
      {
        test: /\.css$/,
        use:['isomorphic-style-loader','css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __isBrowser__: "true"
    }),
    new Dotenv()
  ]
};

const serverConfig = {
  entry: './src/server/index.js',
  node: {
    __filename: false,
    __dirname: false
  },
  mode: mode,
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname),
    filename: 'server.js'
  },
  module: {
    rules: [
      { test: /\.(js)$/, use: 'babel-loader' },
      {
        test: /\.css$/,
        use:['isomorphic-style-loader','css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __isBrowser__: "false"
    }),
    new Dotenv()
  ]
};




module.exports = [browserConfig, serverConfig];
//module.exports = serverConfig
