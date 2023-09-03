import * as path from "path"

export default {
  mode: "development",
  entry: './src/main.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?.*)?$/,
        use: ['file-loader']
      }
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve('dist'),
  },
};