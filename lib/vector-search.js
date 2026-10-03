import fs from 'fs/promises';
import path from 'path';

class VectorSearch {
  constructor() {
    this.documents = [];
    this.embeddings = [];
  }

  async loadData() {
    try {
      const embeddingsPath = path.join(process.cwd(), 'data/embeddings.json');

      const data = await fs.readFile(embeddingsPath, 'utf8');
      const documents = JSON.parse(data);

      this.documents = documents;
      this.embeddings = documents.map(doc => doc.embedding);

      console.log(`Loaded ${this.documents.length} document chunks`);
      return true;
    } catch (error) {
      console.error('Error loading embeddings:', error.message);
      return false;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be of same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  search(queryEmbedding, topK = 5) {
    const similarities = this.embeddings.map((embedding, index) => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return {
        index,
        similarity,
        document: this.documents[index]
      };
    });

    // Sort by similarity (descending) and take top K
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(result => result.similarity > 0.3); // Filter out low similarity results

    return results;
  }

  getDocumentById(id) {
    return this.documents.find(doc => doc.id === id);
  }

  getDocumentsByUrl(url) {
    return this.documents.filter(doc => doc.url === url);
  }

  // Method to get unique documents (avoid multiple chunks from same URL)
  getUniqueDocuments(results, maxUrls = 3) {
    const uniqueUrls = new Set();
    const uniqueResults = [];

    for (const result of results) {
      if (!uniqueUrls.has(result.document.url) && uniqueUrls.size < maxUrls) {
        uniqueUrls.add(result.document.url);
        uniqueResults.push(result);
      }
    }

    return uniqueResults;
  }
}

export default VectorSearch;