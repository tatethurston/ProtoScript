interface Duration {
  seconds: bigint;
  nanos: number;
}

type Timestamp = Duration;

export function serializeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function parseBytes(x: string): Uint8Array {
  // Convert URL-safe Base64 to standard Base64
  let str = x.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if it's missing
  while (str.length % 4) {
    str += "=";
  }

  // decode Base64
  const binary = atob(str);

  // create Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function parseNumber(x: string | number): number {
  if (typeof x === "string") {
    return parseInt(x, 10);
  }
  return x;
}

export function parseDouble(x: string | number): number {
  if (typeof x === "string") {
    return parseFloat(x);
  }
  return x;
}

// Given '.3' => 300_000_000
function parseNanos(x: string | undefined): number {
  return parseInt((x ?? "").padEnd(9, "0"), 10);
}

export function serializeTimestamp({
  seconds = 0n,
  nanos = 0,
}: Partial<Timestamp>): string {
  const ms = Number(seconds) * 1_000 + nanos / 1_000_000;
  return new Date(ms).toISOString();
}

export function parseTimestamp(x: string): Timestamp {
  const seconds = BigInt(Math.floor(new Date(x).getTime() / 1000));
  // Given an RFC 3339 formated date such as 2023-10-18T04:02:27.123Z
  // spliting on '.' will yeild 123Z
  // parseInt will ignore the letter (or any other offset)
  const nanos = parseNanos(x.match(/\.(\d+)/)?.[1]);
  return { seconds, nanos };
}

export function serializeDuration({
  seconds = 0n,
  nanos = 0,
}: Partial<Duration>): string {
  const second = seconds.toString();
  if (nanos === 0) {
    return `${second}s`;
  }

  let nano = Math.abs(nanos).toString().padStart(9, "0");
  // Remove trailing zeros to have either 0, 3, 6 or 9 fractional digits
  if (nano.endsWith("000000")) {
    nano = nano.slice(0, -6);
  } else if (nano.endsWith("000")) {
    nano = nano.slice(0, -3);
  }

  // add negative sign bit for 0 seconds, negative nanos
  if (seconds === 0n && nanos < 0) {
    return `-${second}.${nano}s`;
  }
  return `${second}.${nano}s`;
}

export function parseDuration(x: string): Duration {
  // Given "1.000340012s" or "1s"
  const [seconds, nanos] = x.replace("s", "").split(".");
  return { seconds: BigInt(seconds), nanos: parseNanos(nanos) };
}
