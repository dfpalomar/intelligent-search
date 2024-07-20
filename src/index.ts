import express, { response } from "express";
import { promises as fs } from "fs";

const TransformersApi = Function('return import("@xenova/transformers")')();

const app = express();
const port = 3000;

app.use(express.json());

app.post("/intelligent-search", async (req, res) => {
  try {
    const { pipeline } = await TransformersApi;
    const model = await pipeline(
      "feature-extraction",
      "xenova/all-MiniLM-L6-v2"
    );

    const userQuestion = req.body.question;

    const qaData: Topic[] = await readJSONFile("./FAQ_cleaned.json");

    const userEmbeddingTensor = await model(userQuestion);
    const userEmbeddingArray: number[] = Array.from(userEmbeddingTensor.data);

    const similarities = await Promise.all(
      qaData.flatMap(
        async (topic) =>
          await Promise.all(
            topic.articles.map(async (article) => {
              const articleQA = `${article.title} ${article.body}`;
              const articleEmbeddingTensor = await model(articleQA);
              const articleEmbeddingArray: number[] = Array.from(articleEmbeddingTensor.data);
              return {
                title: article.title,
                body: article.body,
                similarity: computeCosineSimilarity(
                  userEmbeddingArray,
                  articleEmbeddingArray
                ),
              };
            })
          )
      )
    );
    
     // Flatten the array of similarities and filter by threshold
    const threshold = 0.15; // Start with a moderate threshold
    const filteredSimilarities = similarities.flat().filter(article => article.similarity > threshold);

    filteredSimilarities.sort((a, b) => b.similarity - a.similarity);

    const maxNumArticles = 5;
    res.send(filteredSimilarities.slice(0, maxNumArticles));

  } catch (error) {
    console.error("Error loading transformer module:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/faq", (req, res) => {
  const userQuestion = req.query.q;

  if (!userQuestion) {
    return res.status(400).json({ error: "Question is required" });
  } else {
    res.send("Your question is: " + userQuestion);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

async function readJSONFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (err) {
    console.error("Error reading the JSON file:", err);
  }
}

// Utility function to compute cosine similarity
function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  // Type checks
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new TypeError("Inputs to computeCosineSimilarity must be arrays");
  }

  // Compute the dot product of vecA and vecB
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);

  // Compute the magnitude of vecA and vecB
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  // Compute the cosine similarity
  const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);

  return cosineSimilarity;
}

interface Article {
  id: string;
  topicId: number;
  title: string;
  body: string;
}

interface Topic {
  id: number;
  name: string;
  articles: Article[];
}

interface QAData {
  topics: Topic[];
}
