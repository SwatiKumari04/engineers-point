import { getDb } from "../db.js";

const menu = () => getDb().collection("menu");

export const menuStore = {
  list: () => menu().find({}, { projection: { _id: 0 } }).toArray(),

  findById: (id) => menu().findOne({ id }, { projection: { _id: 0 } }),

  async setAvailability(id, available) {
    await menu().updateOne({ id }, { $set: { available } });
    return menu().findOne({ id }, { projection: { _id: 0 } });
  },
};