// Запуск: mongosh "URI" --file queries/part2_queries.js

const LABEL = "before_indexes";

db = db.getSiblingDB("spotify");

// Запит 1 (вечірка): три діапазонні умови
const q1Filter = {
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 }
};

// Запит 2 (популярні артисти)
const q2Pipeline = [
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  { $match: { track_count: { $gte: 3 }, min_popularity: { $gte: 60 } } },
  { $sort: { avg_popularity: -1, track_count: -1 } },
  { $limit: 20 }
];

// Запит 3 (викиди за темпом)
const q3Pipeline = [
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_tempo: { $stdDevPop: "$audio_features.tempo" },
      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: { tempo: "$audio_features.tempo" }
        }
      }
    }
  },
  {
    $addFields: {
      outlier_threshold: { $add: ["$avg_tempo", { $multiply: [2, "$std_tempo"] }] }
    }
  },
  {
    $addFields: {
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "t",
          cond: { $gt: ["$$t.audio_features.tempo", "$outlier_threshold"] }
        }
      }
    }
  },
  { $project: { _id: 0, genre: "$_id", avg_tempo: 1, outlier_threshold: 1, outlier_tracks: 1 } }
];

// Запит 4 (фонове прослуховування):
const q4Pipeline = [
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
      popularity: { $first: "$popularity" }
    }
  }
];

// ---------- Виконання explain ----------
// ---- закоментуй рядки нижче, якщо хочеш виконати запити без explain ----

const explains = {
  q1_party_tracks: db.tracks.find(q1Filter).explain("executionStats"),
  q2_popular_artists: db.tracks.explain("executionStats").aggregate(q2Pipeline),
  q3_tempo_outliers: db.tracks.explain("executionStats").aggregate(q3Pipeline),
  q4_focus_tracks: db.tracks.explain("executionStats").aggregate(q4Pipeline)
};

// ---------- Зберігаємо та виводимо ----------

db.explain_results.deleteMany({ label: LABEL });

print("Індекси в tracks: " + db.tracks.getIndexes().map(i => i.name).join(", "));
print("");

for (const name of Object.keys(explains)) {
  const exp = explains[name];

  let es = exp.executionStats;
  if (!es && exp.stages && exp.stages[0] && exp.stages[0].$cursor) {
    es = exp.stages[0].$cursor.executionStats;
  }

  const text = JSON.stringify(exp);
  const scan = text.includes('"IXSCAN"') ? "IXSCAN" : text.includes('"COLLSCAN"') ? "COLLSCAN" : "?";
  const m = text.match(/"indexName":"([^"]+)"/);

  const summary = {
    query: name,
    scan: scan,
    index: m ? m[1] : "-",
    nReturned: es ? es.nReturned : null,
    totalKeysExamined: es ? es.totalKeysExamined : null,
    totalDocsExamined: es ? es.totalDocsExamined : null,
    executionTimeMillis: es ? es.executionTimeMillis : null
  };

  printjson(summary);

  db.explain_results.insertOne({
    label: LABEL,
    query: name,
    summary: summary,
    explain: exp
  });
}

print("");
print("Збережено у колекцію spotify.explain_results (label: " + LABEL + ")");