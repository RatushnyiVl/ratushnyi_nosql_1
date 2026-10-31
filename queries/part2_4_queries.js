// Запуск: mongosh "URI" --file queries/part2_4_queries.js

db = db.getSiblingDB("spotify");

const pipeline = [
  // Фільтр за умовами завдання
  {
    $match: {
      "audio_features.loudness": { $lt: -10 },
      "audio_features.speechiness": { $lt: 0.1 },
      "audio_features.instrumentalness": { $gt: 0.5 },
      explicit: false
    }
  },

  { $sort: { popularity: -1 } },

  {
    $group: {
      _id: "$track_id",
      track_name: { $first: "$track_name" },
      artists: { $first: "$artists" },
      track_genre: { $first: "$track_genre" },
      popularity: { $first: "$popularity" },
      explicit: { $first: "$explicit" },
      audio_features: { $first: "$audio_features" }
    }
  },

  // Фінальний формат
  {
    $project: {
      _id: 0,
      track_id: "$_id",
      track_name: 1,
      artists: 1,
      track_genre: 1,
      popularity: 1,
      explicit: 1,
      "audio_features.loudness": 1,
      "audio_features.speechiness": 1,
      "audio_features.instrumentalness": 1
    }
  },

  { $sort: { popularity: -1 } }
];

const total = db.tracks.aggregate([...pipeline, { $count: "n" }]).toArray();
print("Унікальних треків для фонового прослуховування: " + (total.length ? total[0].n : 0));

print("Топ-10 за популярністю:");
db.tracks.aggregate([...pipeline, { $limit: 10 }]).forEach(doc => printjson(doc));