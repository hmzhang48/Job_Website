import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'src/plugins/**/*.ts',
    'src/*.ts'
  ],
  platform: "node",
  format: "esm",
  packages: "external",
  bundle: true,
  outdir: '../../docker/node/app/server',
})
