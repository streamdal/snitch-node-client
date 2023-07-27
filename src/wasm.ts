import { WASMResponse } from "@streamdal/snitch-protos/protos/pipeline.js";
// eslint-disable-next-line import/no-unresolved
import { WASI } from "wasi";

const wasi = new WASI({
  preopens: {
    "/sandbox": "./",
  },
});

export const readResponse = (pointer: number, buffer: Uint8Array) => {
  let nullHits = 0;
  const data = [];

  for (let i = pointer; i < buffer.length; i++) {
    //
    // Have three nulls in a row, can quit
    if (nullHits === 3) {
      break;
    }

    // Don't have a length, have to see if we hit three sequential terminators
    if (buffer[i] === 166) {
      nullHits++;
      continue;
    }

    // Not a terminator, reset null hits
    nullHits = 0;
    data.push(buffer[i]);
  }

  return new Uint8Array(data);
};

export const runWasm = async ({
  wasmBytes,
  wasmFunction,
  data,
}: {
  wasmBytes: Uint8Array;
  wasmFunction: string;
  data: Uint8Array;
}) => {
  const wasm = await WebAssembly.compile(wasmBytes);
  const importObject = { wasi_snapshot_preview1: wasi.wasiImport };
  const instance: any = await WebAssembly.instantiate(wasm, importObject);
  const { exports } = instance;
  const { memory, alloc, [wasmFunction]: f } = exports;

  const ptr = alloc(data.length);
  const mem = new Uint8Array(memory.buffer, ptr, data.length);
  mem.set(data);

  const returnPtr = f(ptr, data.length);

  const completeBufferFromMemory = new Uint8Array(memory.buffer);
  const response = readResponse(returnPtr, completeBufferFromMemory);

  return WASMResponse.fromBinary(response);
};