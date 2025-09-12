import { type ProviderDataEntry } from "./provider.ts";
import { recomputeFields } from "./provider.ts";

function writeString(view: DataView, offset: number, str: string): number {
  const utf8 = new TextEncoder().encode(str);
  view.setUint32(offset, utf8.length, true);
  utf8.forEach((b, i) => view.setUint8(offset + 4 + i, b));
  return offset + (4 + utf8.length);
}

function readString(view: DataView, offset: number): [string, number] {
  const len = view.getUint32(offset, true);
  const bytes = new Uint8Array(view.buffer, offset + 4, len);
  return [new TextDecoder().decode(bytes), 4 + len];
}

const writeUint32 = (view: DataView, offset: number, value: number): number => {
  view.setUint32(offset, value, true);
  return offset + 4;
};
const writeFloat64 = (
  view: DataView,
  offset: number,
  value: number,
): number => {
  view.setFloat64(offset, value, true);
  return offset + 8;
};

export function serializeProvider(entry: ProviderDataEntry): Uint8Array {
  // Rough upper bound to avoid reallocating
  const buf = new ArrayBuffer(4096);
  const view = new DataView(buf);
  let offset = 0;

  offset = writeString(view, offset, entry.providerName);

  // ---- integers (uint32) ----
  offset = writeUint32(view, offset, entry.numberOfJobs);
  offset = writeUint32(view, offset, entry.numberOfJobs24h);

  // ---- floats ----

  offset = writeFloat64(view, offset, entry.totalWork);
  offset = writeFloat64(view, offset, entry.totalWork24h);
  offset = writeFloat64(view, offset, entry.totalCost);
  offset = writeFloat64(view, offset, entry.totalCost24h);
  offset = writeFloat64(view, offset, entry.totalWorkHours);
  offset = writeFloat64(view, offset, entry.totalWorkHours24h);

  offset = writeString(view, offset, entry.jobId);

  // ---- dates (as float64 timestamp) ----
  offset = writeFloat64(view, offset, new Date(entry.lastJobDate).getTime());

  // ---- durations (float64 here) ----
  offset = writeFloat64(view, offset, entry.longestJob);
  offset = writeFloat64(view, offset, entry.longestJob24h);

  return new Uint8Array(buf, 0, offset);
}

export function deserializeProvider(
  providerId: string,
  data: Uint8Array,
): ProviderDataEntry {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  let str: string, consumed: number;

  [str, consumed] = readString(view, offset);
  const providerName = str;
  offset += consumed;

  const numberOfJobs = view.getUint32(offset, true);
  offset += 4;
  const numberOfJobs24h = view.getUint32(offset, true);
  offset += 4;

  const totalWork = view.getFloat64(offset, true);
  offset += 8;
  const totalWork24h = view.getFloat64(offset, true);
  offset += 8;
  const totalCost = view.getFloat64(offset, true);
  offset += 8;
  const totalCost24h = view.getFloat64(offset, true);
  offset += 8;
  const totalWorkHours = view.getFloat64(offset, true);
  offset += 8;
  const totalWorkHours24h = view.getFloat64(offset, true);
  offset += 8;

  [str, consumed] = readString(view, offset);
  const jobId = str;
  offset += consumed;

  const lastJobDate = new Date(view.getFloat64(offset, true)).toISOString();
  offset += 8;

  const longestJob = view.getFloat64(offset, true);
  offset += 8;
  const longestJob24h = view.getFloat64(offset, true);
  offset += 8;

  return recomputeFields({
    providerName,
    providerId,
    numberOfJobs,
    numberOfJobs24h,
    totalWork,
    totalWork24h,
    totalCost,
    totalCost24h,
    totalWorkHours,
    totalWorkHours24h,
    jobId,
    lastJobDate,
    longestJob,
    longestJob24h,
    speed: 0,
    speed24h: 0,
    efficiency: 0,
    efficiency24h: 0,
  });
}

const original: ProviderDataEntry = {
  providerName: "Acme",
  providerId: "123",
  numberOfJobs: 10,
  numberOfJobs24h: 2,
  totalWork: 100,
  totalWork24h: 20,
  jobId: "job-xyz",
  totalCost: 50,
  totalCost24h: 5,
  totalWorkHours: 40,
  totalWorkHours24h: 8,
  lastJobDate: new Date().toISOString(),
  longestJob: 12,
  longestJob24h: 4,
  speed: 0,
  speed24h: 0,
  efficiency: 0,
  efficiency24h: 0,
};

const bin = serializeProvider(original);

console.log(`Serialized size: ${bin.length}`);
console.log("Json size:", JSON.stringify(original).length);
const restored = deserializeProvider(original.providerId, bin);

console.log(restored);
