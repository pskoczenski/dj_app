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
  // @ts-expect-error - assign for test runtime
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  // @ts-expect-error - assign for test runtime
  globalThis.TextDecoder = TextDecoder;
}
if (!globalThis.crypto) {
  // @ts-expect-error - assign for test runtime
  globalThis.crypto = webcrypto;
} else if (!globalThis.crypto.subtle) {
  // jsdom may provide `crypto` without `subtle`; patch it in.
  // @ts-expect-error - patch for test runtime
  globalThis.crypto.subtle = webcrypto.subtle;
}
if (!globalThis.ReadableStream) {
  // @ts-expect-error - assign for test runtime
  globalThis.ReadableStream = ReadableStream;
}
if (!globalThis.TransformStream) {
  // @ts-expect-error - assign for test runtime
  globalThis.TransformStream = TransformStream;
}
if (!globalThis.WritableStream) {
  // @ts-expect-error - assign for test runtime
  globalThis.WritableStream = WritableStream;
}
if (!globalThis.MessageChannel) {
  // @ts-expect-error - assign for test runtime
  globalThis.MessageChannel = MessageChannel;
}
if (!globalThis.MessagePort) {
  // @ts-expect-error - assign for test runtime
  globalThis.MessagePort = MessagePort;
}

// Load fetch polyfill after TextDecoder/TextEncoder are present.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require("undici") as typeof import("undici");
const { Headers, Request, Response, fetch } = undici;

if (!globalThis.Headers) {
  // @ts-expect-error - assign for test runtime
  globalThis.Headers = Headers;
}
if (!globalThis.Request) {
  // @ts-expect-error - assign for test runtime
  globalThis.Request = Request;
}
if (!globalThis.Response) {
  // @ts-expect-error - assign for test runtime
  globalThis.Response = Response;
}
if (!globalThis.fetch) {
  // @ts-expect-error - assign for test runtime
  globalThis.fetch = fetch;
}
