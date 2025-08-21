// Global module declarations for non-TS assets
// Allow importing plain CSS files for side effects in TS/TSX
declare module '*.css' {
   const content: string;
   export default content;
}
