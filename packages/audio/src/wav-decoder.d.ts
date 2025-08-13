// TypeScript module declaration for wav-decoder
// Place this in your src or test folder to fix type errors

declare module 'wav-decoder' {
  export function decode(buffer: Buffer | ArrayBuffer): Promise<any>;
}
