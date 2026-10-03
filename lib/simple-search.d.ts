declare class SimpleSearch {
  constructor();
  documents: any[];

  loadData(): Promise<boolean>;
  search(query: string, topK?: number): Array<{
    document: {
      id: string;
      url: string;
      title: string;
      chunk: string;
      embedding: null;
      metadata: any;
    };
    similarity: number;
  }>;
  getUniqueDocuments(results: any[], maxUrls?: number): any[];
}

export default SimpleSearch;