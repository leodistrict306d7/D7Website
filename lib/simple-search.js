import fs from 'fs/promises';
import path from 'path';

class SimpleSearch {
  constructor() {
    this.documents = [];
  }

  async loadData() {
    try {
      const docsPath = path.join(process.cwd(), 'data/docs.json');

      const data = await fs.readFile(docsPath, 'utf8');
      const documents = JSON.parse(data);

      this.documents = documents;
      console.log(`Loaded ${this.documents.length} documents for simple search`);
      return true;
    } catch (error) {
      console.error('Error loading documents:', error.message);
      return false;
    }
  }

  // Simple keyword-based search
  search(query, topK = 5) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const scores = this.documents.map(doc => {
      const text = doc.text.toLowerCase();
      const title = doc.title.toLowerCase();
      
      let score = 0;
      
      // Count keyword matches
      queryWords.forEach(word => {
        // Title matches are worth more
        const titleMatches = (title.match(new RegExp(word, 'g')) || []).length;
        score += titleMatches * 3;
        
        // Text matches
        const textMatches = (text.match(new RegExp(word, 'g')) || []).length;
        score += textMatches;
      });
      
      // Boost score for shorter documents (more focused)
      score = score / (1 + doc.text.length / 1000);
      
      return {
        document: {
          id: doc.url,
          url: doc.url,
          title: doc.title,
          chunk: doc.text,
          embedding: null, // No embeddings in simple mode
          metadata: doc
        },
        similarity: Math.min(score / 10, 1) // Normalize to 0-1 range
      };
    });

    // Sort by score and take top K
    const results = scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(result => result.similarity > 0.1); // Filter out very low scores

    return results;
  }

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

export default SimpleSearch;