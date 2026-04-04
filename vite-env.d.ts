/// <reference types="vite/client" />

declare module 'maplibre-gl/dist/maplibre-gl.css';

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_MAP_NAME: string;
  readonly VITE_AWS_API_KEY: string;
  readonly VITE_AWS_PLACE_INDEX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}