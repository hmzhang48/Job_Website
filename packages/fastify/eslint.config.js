import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
export default tslint.config(
  eslint.configs.recommended,
  unicorn.configs['recommended'],
  ...tslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true
      }
    }
  }
)
