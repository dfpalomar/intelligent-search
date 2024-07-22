
# Intelligent Search API

This repository contains the source code for the Intelligent Search API, designed to provide quick and accurate answers to user inquiries based on existing FAQ information. The API uses a pre-trained transformer model to compute semantic similarities between user queries and FAQ articles, returning the most relevant answers.

## Features

- Provides an intelligent search endpoint for querying FAQ information.
- Utilizes pre-trained transformer models for feature extraction and semantic similarity computations.
- Precomputes embeddings for FAQ articles to ensure fast and efficient query processing.

## Models Used

The project uses the `xenova/all-MiniLM-L6-v2` model from the `@xenova/transformers` library. This model is used for feature extraction to generate embeddings for both FAQ articles and user queries.

## Project Dependencies

- [express](https://www.npmjs.com/package/express): Web framework for Node.js.
- [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers): Library for transformer models.
- [fs](https://nodejs.org/api/fs.html): File system module for reading and writing files.

## Getting Started

### Prerequisites

- Node.js and npm should be installed on your machine.
- Ensure you have the FAQ JSON file (`FAQ.json`) in the root directory.

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/intelligent-search-api.git
   cd intelligent-search-api
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

### Running the Project Locally

1. Start the server:
   ```sh
   npm start
   ```

2. The server will be running at `http://localhost:3000`.

### API Endpoints

#### Intelligent Search

- **Endpoint:** `/intelligent-search`
- **Method:** `POST`
- **Description:** Accepts a user query and returns the most relevant FAQ articles.
- **Request Body:**
  ```json
  {
    "question": "Your question here"
  }
  ```
- **Response:**
  ```json
  [
    {
      "title": "Article Title",
      "body": "Article Body",
      "similarity": 0.95
    },
    ...
  ]
  ```

## Project Structure

- `index.ts`: Main entry point of the application.
- `FAQ.json`: JSON file containing the FAQ data.
- `package.json`: Project metadata and dependencies.

## How It Works

1. **Model Initialization:** The server initializes by loading the transformer model and precomputing embeddings for all FAQ articles.
2. **Data Initialization:** FAQ data is read from `FAQ.json` and stored in memory.
3. **Embeddings Computation:** Precomputed embeddings for FAQ articles are used to quickly compute similarities with user queries.
4. **Cosine Similarity:** The API computes cosine similarity between the user query embedding and each article embedding, returning the top matching articles.
