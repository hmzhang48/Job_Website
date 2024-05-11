import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import stylelint from '@stylistic/eslint-plugin'
import unicorn from 'eslint-plugin-unicorn'
export default tslint.config(
  eslint.configs.recommended,
  unicorn.configs[ 'flat/recommended' ],
  ...tslint.configs.recommendedTypeChecked,
  ...tslint.configs.stylisticTypeChecked,
  stylelint.configs[ 'recommended-flat' ],
  {
    languageOptions: {
      parserOptions: {
        project: true
      }
    }
  }
)
