declare class VectorSearch {
  constructor();
  documents: any[];
  embeddings: number[][];

  loadData(): Promise<boolean>;
  cosineSimilarity(vecA: number[], vecB: number[]): number;
  search(queryEmbedding: number[], topK?: number): Array<{
    index: number;
    similarity: number;
    document: any;
  }>;
  getDocumentById(id: string): any;
  getDocumentsByUrl(url: string): any[];
  getUniqueDocuments(results: any[], maxUrls?: number): any[];
}

export default VectorSearch;