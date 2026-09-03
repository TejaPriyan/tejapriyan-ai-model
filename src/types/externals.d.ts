declare module "*.wasm?url" {
  const src: string;
  export default src;
}

declare module "sql.js" {
  export type SqlValue = number | string | Uint8Array | null;
  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }
  export interface Database {
    exec(sql: string): QueryExecResult[];
    run(sql: string): void;
    close(): void;
  }
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
    wasmBinary?: ArrayBuffer | Uint8Array;
  }
  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
