import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';

const pkg = require('./package.json');

const srcLibraryName = 'text-decorator';
const LibraryName = 'TextDecorator';

const outputCommon = {
        globals: { 'react': 'React', 'react-dom': 'ReactDOM' },
        banner: `/* React is optional dependency */\n` +
                `if (typeof React === 'undefined') React = undefined;\n`,
        sourcemap: true
      };

export default {
  input: `src/${srcLibraryName}.ts`,
  output: [
    { file: pkg.main, name: LibraryName, format: 'umd', ...outputCommon },
    { file: pkg.global, name: LibraryName, format: 'iife', ...outputCommon },
    { file: pkg.module, format: 'es', ...outputCommon },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: ['react', 'react-dom'],
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps()
  ],
};
