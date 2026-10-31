// Запуск: mongosh "URI" --file queries/part2_queries.js

db = db.getSiblingDB("spotify");

const filter = {
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 }
};

const projection = {
  _id: 0,
  track_name: 1,
  artists: 1,
  track_genre: 1,
  duration_sec: 1,
  "audio_features.danceability": 1,
  "audio_features.energy": 1
};

print("Знайдено треків для вечірки: " + db.tracks.countDocuments(filter));

print("Топ-10 за популярністю:");
db.tracks
  .find(filter, projection)
  .sort({ popularity: -1 })
  .limit(10)
  .forEach(doc => printjson(doc));