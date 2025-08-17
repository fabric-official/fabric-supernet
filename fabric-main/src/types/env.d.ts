
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPSTORE_REGISTRY_URL: string;
  readonly VITE_APPSTORE_REGISTRY_SIG_URL: string;
  readonly VITE_APPSTORE_PUBKEY_ED25519: string;
  readonly VITE_PLUGIN_DEFAULT_PUBKEY_ED25519?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
