/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_STORAGE_ACCOUNT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
