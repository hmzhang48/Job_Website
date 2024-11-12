import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
import vue from 'eslint-plugin-vue'
export default tslint.config(
  eslint.configs.recommended,
  unicorn.configs[ 'flat/recommended' ],
  ...tslint.configs.recommended,
  ...vue.configs[ 'flat/recommended' ],
  {
    languageOptions: {
      parserOptions: {
        parser: tslint.parser,
        project: true,
        extraFileExtensions: [ ".vue" ],
        sourceType: "module"
      }
    },
    rules: {
      "unicorn/filename-case": "off",
      "unicorn/prevent-abbreviations": "off"
    }
  }
)
