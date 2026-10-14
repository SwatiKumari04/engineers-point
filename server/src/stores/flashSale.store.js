import { randomUUID } from "node:crypto";
import { getDb } from "../db.js";

const sales = () => getDb().collection("sales");

export const flashSaleStore = {
  async create(data) {
    const sale = {
      id: randomUUID(),
      claimedBy: {}, // phone → { state: "PENDING" | "CONFIRMED", at: <ms timestamp> }
      createdAt: new Date().toISOString(),
      ...data,
    };
    await sales().insertOne({ ...sale });
    return sale;
  },

  findById: (id) => sales().findOne({ id }, { projection: { _id: 0 } }),

  listAll: () => sales().find({}, { projection: { _id: 0 } }).toArray(),

  // ATOMIC claim: decrement stock + record PENDING with a timestamp, only if the
  // sale is live, has stock, and this phone hasn't claimed. Returns updated sale or null.
  tryClaim: (id, phone, now) =>
    sales().findOneAndUpdate(
      {
        id,
        status: { $ne: "ENDED" },
        endsAt: { $gt: now },
        stock: { $gt: 0 },
        [`claimedBy.${phone}`]: { $exists: false },
      },
      { $inc: { stock: -1 }, $set: { [`claimedBy.${phone}`]: { state: "PENDING", at: now } } },
      { returnDocument: "after", projection: { _id: 0 } },
    ),

  // ATOMIC confirm: PENDING → CONFIRMED only if still PENDING (keeps the timestamp).
  tryConfirm: (id, phone) =>
    sales().findOneAndUpdate(
      { id, [`claimedBy.${phone}.state`]: "PENDING" },
      { $set: { [`claimedBy.${phone}.state`]: "CONFIRMED" } },
      { returnDocument: "after", projection: { _id: 0 } },
    ),

  // ATOMIC release: return the unit + drop the claim only if still PENDING.
  tryRelease: (id, phone) =>
    sales().findOneAndUpdate(
      { id, [`claimedBy.${phone}.state`]: "PENDING" },
      { $inc: { stock: 1 }, $unset: { [`claimedBy.${phone}`]: "" } },
      { returnDocument: "after", projection: { _id: 0 } },
    ),

  setEnded: (id) =>
    sales().findOneAndUpdate(
      { id },
      { $set: { status: "ENDED" } },
      { returnDocument: "after", projection: { _id: 0 } },
    ),
};