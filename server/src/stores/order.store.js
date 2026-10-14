import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";

const orders = () => getDb().collection("orders");
const counters = () => getDb().collection("counters");

// Atomic, persistent order number (EP-101, EP-102, ...) — survives restarts
// and stays unique even across multiple server instances.
async function nextOrderNo() {
  const c = await counters().findOneAndUpdate(
    { _id: "orderNo" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return `EP-${100 + c.seq}`;
}

export const orderStore = {
  async create(data) {
    const order = {
      id: randomUUID(),
      orderNo: await nextOrderNo(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    await orders().insertOne({ ...order }); // copy so Mongo's _id isn't added to what we return
    return order;
  },

  findById: (id) => orders().findOne({ id }, { projection: { _id: 0 } }),

  listAll: () =>
    orders().find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(),

  listByPhone: (phone) =>
    orders().find({ "customer.phone": phone }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(),

  // Conditional status change, used by markReady.
  setStatus: (id, status) =>
    orders().findOneAndUpdate({ id }, { $set: { status } }, { returnDocument: "after", projection: { _id: 0 } }),
};