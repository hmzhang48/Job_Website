import eslint from '@eslint/js'
import globals from "globals"
import tslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
export default tslint.config(
  eslint.configs.recommended,
  unicorn.configs['recommended'],
  ...tslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true
      },
    }
  }
)