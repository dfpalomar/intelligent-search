import express, { response } from "express";
import { promises as fs } from "fs";

const TransformersApi = Function('return import("@xenova/transformers")')();

const app = express();
const port = 3000;

let llmModel: any;
let faqData: Topic[] = [];
let articleEmbeddings: { [key: string]: number[] } = {};

app.use(express.json());

const loadLLMModel = async () => {
  const { pipeline } = await TransformersApi;
  llmModel = await pipeline("feature-extraction", "xenova/all-MiniLM-L12-v2");
};

const loadFAQ = async () => {
  faqData = (await readJSONFile("./FAQ.json")) || [];
};

const precomputeArticleEmbeddings = async () => {
  for (const topic of faqData) {
    for (const article of topic.articles) {
      const articleQA = `${article.title} ${article.body}`;
      const articleEmbeddingTensor = await llmModel(articleQA);
      articleEmbeddings[article.id] = Array.from(articleEmbeddingTensor.data);
    }
  }
};

loadLLMModel()
  .then(loadFAQ)
  .then(precomputeArticleEmbeddings)
  .catch((error) => {
    console.error("Error during initialization:", error);
  });

  
app.post("/intelligent-search", async (req, res) => {
  try {
    const userQuestion = req.body.question;
    const searchResults = await performIntelligentSearch(userQuestion);
    res.send(searchResults);
  } catch (error) {
    console.error("Error processing intelligent search:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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

async function performIntelligentSearch(userQuestion: string) {
  const userEmbeddingTensor = await llmModel(userQuestion);
  const userEmbeddingArray: number[] = Array.from(userEmbeddingTensor.data);

  const similarities = faqData.flatMap((topic) =>
    topic.articles.map((article) => {
      const articleEmbeddingArray = articleEmbeddings[article.id];
      return {
        topicId: article.topicId,
        articleId: article.id,
        title: article.title,
        body: article.body,
        similarity: computeCosineSimilarity(
          userEmbeddingArray,
          articleEmbeddingArray
        ),
      };
    })
  );

  const threshold = 0.15;
  const filteredSimilarities = similarities
    .flat()
    .filter((article) => article.similarity > threshold);

  filteredSimilarities.sort((a, b) => b.similarity - a.similarity);

  const maxNumArticles = 5;
  return filteredSimilarities.slice(0, maxNumArticles);
}

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new TypeError("Inputs to computeCosineSimilarity must be arrays");
  }
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
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
