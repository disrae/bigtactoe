import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    name: v.string(),
    playerId: v.string(),
  }).index("by_playerId", ["playerId"]),

  game: defineTable({
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    players: v.array(v.string()),
    board: v.array(v.array(v.union(v.string(), v.null()))),
    currentPlayerIndex: v.number(),
    winner: v.union(v.string(), v.null()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
});

