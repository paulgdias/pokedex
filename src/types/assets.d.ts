/** Vite's `?inline` suffix imports an asset as a base64 data URI (tests and stories only). */
declare module "*.png?inline" {
    const dataUri: string;
    export default dataUri;
}
