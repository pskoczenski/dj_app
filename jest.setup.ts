// RTL custom matchers (toBeInTheDocument, toHaveTextContent, etc.)
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { MessageChannel, MessagePort } from "node:worker_threads";
import { webcrypto } from "node:crypto";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Next.js server utilities assume Fetch globals exist.
// Jest's jsdom environment may not provide them, so polyfill.
if (!globalThis.TextEncoder) {
  (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
    TextEncoder;
}
if (!globalThis.TextDecoder) {
  (globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder;
}
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
} else if (!globalThis.crypto.subtle) {
  // jsdom may provide `crypto` without `subtle`; replace with WebCrypto.
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
if (!globalThis.ReadableStream) {
  (globalThis as unknown as { ReadableStream: typeof ReadableStream }).ReadableStream =
    ReadableStream;
}
if (!globalThis.TransformStream) {
  (
    globalThis as unknown as { TransformStream: typeof TransformStream }
  ).TransformStream = TransformStream;
}
if (!globalThis.WritableStream) {
  (globalThis as unknown as { WritableStream: typeof WritableStream }).WritableStream =
    WritableStream;
}
if (!globalThis.MessageChannel) {
  (globalThis as unknown as { MessageChannel: typeof MessageChannel }).MessageChannel =
    MessageChannel;
}
if (!globalThis.MessagePort) {
  (globalThis as unknown as { MessagePort: typeof MessagePort }).MessagePort =
    MessagePort;
}

// Load fetch polyfill after TextDecoder/TextEncoder are present.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require("undici") as typeof import("undici");
const { Headers, Request, Response, fetch } = undici;

if (!globalThis.Headers) {
  (globalThis as unknown as { Headers: typeof Headers }).Headers = Headers;
}
if (!globalThis.Request) {
  (globalThis as unknown as { Request: typeof Request }).Request = Request;
}
if (!globalThis.Response) {
  (globalThis as unknown as { Response: typeof Response }).Response = Response;
}
if (!globalThis.fetch) {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetch;
}
