export type PlaygroundLang = "javascript" | "html" | "python" | "css" | (string & {});

export interface OllamaStreamChunk {
  message?: { content?: string };
  done?: boolean;
}

export function escapeInlineScriptTag(code: string): string;
export function escapeInlineStyleTag(code: string): string;
export function isTrustedIframeMessage(
  event: Pick<MessageEvent, "source" | "origin">,
  expectedWindow: Window | null | undefined
): boolean;
export function hasTejapriyanModel(data: unknown): boolean;
export function consumeOllamaNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onParsedLine: (chunk: OllamaStreamChunk) => void
): Promise<void>;
export function isLoopbackHostname(hostname: string): boolean;
export function isLoopbackEndpoint(raw: string): boolean;
export function sanitizeEndpointUrl(raw: string): string;
export function queryLoopbackPermissionSafe(
  permissionsObj?: Pick<Permissions, "query"> | null
): Promise<PermissionState>;
export function shouldAutoCheckLocal(ctx: {
  protocol: string;
  hostname: string;
  loopbackPermission: PermissionState;
}): boolean;
export function buildPlaygroundHtml(code: string, currentLang: PlaygroundLang): string;
