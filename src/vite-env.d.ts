/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_BYPASS?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
