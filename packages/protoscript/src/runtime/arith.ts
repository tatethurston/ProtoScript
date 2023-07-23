// This is to preserve the signatures in writer.ts
// TODO convert writer to use bigint directly

export class UInt64 {
  bigint: bigint;
  lo: number;
  hi: number;
  constructor(bigint: bigint, lo: number, hi: number) {
    this.bigint = bigint;
    this.lo = lo;
    this.hi = hi;
  }
  toString() {
    return this.bigint.toString();
  }
  static fromString(s: string) {
    const bigint = BigInt.asUintN(64, BigInt(s));
    const lo = Number(BigInt.asUintN(32, bigint));
    const hi = Number(bigint >> BigInt(32));
    return new UInt64(bigint, lo, hi);
  }
}

export class Int64 extends UInt64 {
  static fromString(s: string) {
    const bigint = BigInt.asIntN(64, BigInt(s));
    const { lo, hi } = UInt64.fromString(s);
    return new Int64(bigint, lo, hi);
  }
}
