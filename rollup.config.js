import typescriptPlugin from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  plugins: [
    typescriptPlugin({
      useTsconfigDeclarationDir: true,
    }),
  ],
  output: [
    { file: 'dist/giltig.js', format: 'cjs', sourcemap: true },
    { file: 'dist/giltig.mjs', format: 'esm', sourcemap: true },
  ],
};
