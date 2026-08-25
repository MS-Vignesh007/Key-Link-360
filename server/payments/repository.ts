import { randomBytes } from "node:crypto";
import { flushRootStore, getRootStore, setRootStore } from "../db/rootStore";
import type { PaymentRecord, PaymentRecordStatus } from "./types";

const STORE_KEY = "razorpay_payments";

function newId() {
  return `pay_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function listRaw(): PaymentRecord[] {
  const store = getRootStore();
  const rows = store[STORE_KEY];
  return Array.isArray(rows) ? (rows as PaymentRecord[]) : [];
}

function saveAll(rows: PaymentRecord[]) {
  const store = getRootStore();
  store[STORE_KEY] = rows;
  setRootStore(store);
}

export function findPaymentById(id: string): PaymentRecord | null {
  const needle = String(id || "").trim();
  if (!needle) return null;
  return listRaw().find((row) => row.id === needle) || null;
}

export function findPaymentByOrderId(orderId: string): PaymentRecord | null {
  const needle = String(orderId || "").trim();
  if (!needle) return null;
  return listRaw().find((row) => row.razorpayOrderId === needle) || null;
}

export function createPaymentRecord(
  partial: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: PaymentRecordStatus;
  }
): PaymentRecord {
  const now = new Date().toISOString();
  const record: PaymentRecord = {
    ...partial,
    id: newId(),
    status: partial.status || "created",
    createdAt: now,
    updatedAt: now
  };
  const rows = listRaw();
  rows.unshift(record);
  saveAll(rows.slice(0, 2000));
  void flushRootStore();
  return record;
}

export function updatePaymentRecord(
  id: string,
  patch: Partial<PaymentRecord>
): PaymentRecord | null {
  const rows = listRaw();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const next: PaymentRecord = {
    ...rows[index],
    ...patch,
    id: rows[index].id,
    updatedAt: new Date().toISOString()
  };
  rows[index] = next;
  saveAll(rows);
  void flushRootStore();
  return next;
}
