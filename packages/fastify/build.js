import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/**/*.ts'],
  platform: "node",
  format: "esm",
  packages: "external",
  bundle: true,
  outdir: 'dist',
})
