/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVATE_KEY: string
  readonly VITE_RELAYER_URL: string
  readonly VITE_SEPOLIA_RPC_URL: string
  readonly VITE_ETHERSCAN_API_KEY: string
  readonly VITE_FHEVM_CONTRACT_ADDRESS: string
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
} 