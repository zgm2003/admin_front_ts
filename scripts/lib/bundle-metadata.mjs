import { relative, resolve, sep } from 'node:path'

function normalizeModuleId(projectRoot, moduleId) {
  const cleanId = moduleId.split('?')[0].replaceAll('\\', '/')
  const nodeModulesMarker = '/node_modules/'
  const nodeModulesIndex = cleanId.lastIndexOf(nodeModulesMarker)
  if (nodeModulesIndex !== -1) {
    return `node_modules/${cleanId.slice(nodeModulesIndex + nodeModulesMarker.length)}`
  }

  const relativeId = relative(projectRoot, cleanId).split(sep).join('/')
  return relativeId.startsWith('../') ? cleanId : relativeId
}

function importedCss(chunk) {
  const css = chunk.viteMetadata?.importedCss
  return css ? [...css].sort() : []
}

export function bundleMetadataPlugin(projectRoot) {
  const normalizedRoot = resolve(projectRoot)
  return {
    name: 'admin-bundle-metadata',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle)
        .filter((item) => item.type === 'chunk')
        .map((chunk) => ({
          file: chunk.fileName,
          isEntry: chunk.isEntry,
          isDynamicEntry: chunk.isDynamicEntry,
          imports: [...chunk.imports].sort(),
          dynamicImports: [...chunk.dynamicImports].sort(),
          css: importedCss(chunk),
          modules: Object.keys(chunk.modules)
            .map((moduleId) => normalizeModuleId(normalizedRoot, moduleId))
            .sort(),
        }))
        .sort((left, right) => left.file.localeCompare(right.file))

      this.emitFile({
        type: 'asset',
        fileName: 'bundle-metadata.json',
        source: `${JSON.stringify({ schemaVersion: 1, chunks }, null, 2)}\n`,
      })
    },
  }
}
