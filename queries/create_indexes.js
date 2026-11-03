// Запуск: mongosh "URI" --file queries/create_indexes.js

db = db.getSiblingDB("spotify");

// Запит 1 (вечірка): три діапазонні умови
db.tracks.createIndex(
  {
    "audio_features.danceability": 1,
    "audio_features.energy": 1,
    duration_ms: 1
  },
  { name: "idx_q1_party" }
);

// Запит 4 (фонове прослуховування):
db.tracks.createIndex(
  {
    explicit: 1,
    "audio_features.instrumentalness": 1,
    "audio_features.loudness": 1,
    "audio_features.speechiness": 1
  },
  { name: "idx_q4_focus" }
);

// Запит 2 (популярні артисти)
db.tracks.createIndex(
  { artists: 1, popularity: 1 },
  { name: "idx_q2_artists" }
);

// Запит 3 (викиди за темпом)
db.tracks.createIndex(
  { track_genre: 1, "audio_features.tempo": 1 },
  { name: "idx_q3_genre_tempo" }
);

// Підсумок
print("Індекси в tracks:");
db.tracks.getIndexes().forEach(i => print("  " + i.name + "  " + JSON.stringify(i.key)));

try {
  const sizes = db.tracks.stats().indexSizes;
  print("\nРозміри індексів (байти):");
  printjson(sizes);
} catch (e) {
  print("\nРозміри індексів недоступні: " + e.message);
}
