// Запуск: mongosh "URI" --file queries/part2_2_queries.js

db = db.getSiblingDB("spotify");

db.tracks.aggregate([
  { $unwind: "$artists" },

  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },

  {
    $match: {
      track_count: { $gte: 3 },
      min_popularity: { $gte: 60 }
    }
  },

  { $sort: { avg_popularity: -1, track_count: -1 } },
  { $limit: 20 },

  {
    $project: {
      _id: 0,
      artist: "$_id",
      track_count: 1,
      min_popularity: 1,
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  }
]).forEach(doc => printjson(doc));