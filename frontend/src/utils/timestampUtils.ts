export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now() {
    return Timestamp.fromMillis(Date.now());
  }

  static fromDate(date: Date) {
    return Timestamp.fromMillis(date.getTime());
  }

  static fromMillis(milliseconds: number) {
    return new Timestamp(
      Math.floor(milliseconds / 1000),
      (milliseconds % 1000) * 1000000
    );
  }

  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }

  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1000000;
  }
}

export function safeConvertToTimestamp(date: any): Timestamp {
  if (!date) return Timestamp.now();
  if (date instanceof Timestamp) return date;
  if (date instanceof Date) return Timestamp.fromDate(date);
  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? Timestamp.now() : Timestamp.fromDate(parsed);
  }
  if (typeof date === "number") {
    return Timestamp.fromMillis(date);
  }
  return Timestamp.now();
}

export function safeConvertToDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === "string" || typeof date === "number") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

export function safeConvertToISOString(date: any): string {
  return safeConvertToDate(date).toISOString();
}

export function getCurrentTimestamp(): Timestamp {
  return Timestamp.now();
}

export function dateToTimestamp(date?: Date | null): Timestamp {
  return date ? Timestamp.fromDate(date) : Timestamp.now();
}

export function toTimestamp(input?: Date | Timestamp | string | null): Timestamp {
  return safeConvertToTimestamp(input);
}

export function isTimestamp(date: any): date is Timestamp {
  return date instanceof Timestamp;
}

export function safeGetMillis(date: any): number {
  if (date instanceof Timestamp) return date.toMillis();
  if (date instanceof Date) return date.getTime();
  if (typeof date === "string" || typeof date === "number") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
  }
  return Date.now();
}
