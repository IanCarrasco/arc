export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract: string;
  arxivId?: string;
  url: string;
  fetchedAt: Date;
  displayUrl: string;
}

export class PaperMetadataStorage {
  private static readonly STORAGE_PREFIX = 'paper-metadata-';

  /**
   * Generate a storage key for a paper URL
   */
  private static generateKey(paperUrl: string): string {
    return `${this.STORAGE_PREFIX}${btoa(paperUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  /**
   * Store paper metadata in localStorage
   */
  static store(metadata: PaperMetadata): void {
    try {
      const key = this.generateKey(metadata.url);
      const dataToStore = {
        ...metadata,
        fetchedAt: metadata.fetchedAt.toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(dataToStore));
      console.log('Successfully stored metadata for:', metadata.url, 'with key:', key);
    } catch (error) {
      console.warn('Failed to store paper metadata:', error);
    }
  }

  /**
   * Retrieve paper metadata from localStorage
   */
  static get(paperUrl: string): PaperMetadata | null {
    try {
      const key = this.generateKey(paperUrl);
      const stored = localStorage.getItem(key);

      if (!stored) {
        console.log('No stored metadata found for:', paperUrl, 'with key:', key);
        return null;
      }

      const parsed = JSON.parse(stored);
      const metadata = {
        ...parsed,
        fetchedAt: new Date(parsed.fetchedAt),
      };

      console.log('Retrieved metadata for:', paperUrl, metadata);
      return metadata;
    } catch (error) {
      console.warn('Failed to retrieve paper metadata:', error);
      return null;
    }
  }

  /**
   * Check if metadata exists and is not too old (24 hours)
   */
  static hasValidCache(paperUrl: string, maxAgeHours: number = 24): boolean {
    try {
      const metadata = this.get(paperUrl);
      if (!metadata) {
        console.log('No cached metadata found for:', paperUrl);
        return false;
      }

      const ageMs = Date.now() - metadata.fetchedAt.getTime();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      const isValid = ageMs < maxAgeMs;

      console.log(`Cache check for ${paperUrl}: age=${Math.round(ageMs/1000/60)}min, maxAge=${maxAgeHours}h, valid=${isValid}`);
      return isValid;
    } catch (error) {
      console.warn('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Get all stored paper metadata for recent papers
   */
  static getAllRecent(maxAgeHours: number = 24): PaperMetadata[] {
    const papers: PaperMetadata[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          try {
            const encodedUrl = key.replace(this.STORAGE_PREFIX, '');
            const paperUrl = atob(encodedUrl);

            const metadata = this.get(paperUrl);
            if (metadata) {
              const ageMs = Date.now() - metadata.fetchedAt.getTime();
              const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

              if (ageMs < maxAgeMs) {
                papers.push(metadata);
              }
            }
          } catch (error) {
            console.warn('Failed to parse stored paper metadata:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve recent papers:', error);
    }

    // Sort by most recently fetched
    return papers.sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime());
  }

  /**
   * Clear old metadata (older than specified hours)
   */
  static clearOld(maxAgeHours: number = 24): void {
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              const fetchedAt = new Date(parsed.fetchedAt);
              const ageMs = Date.now() - fetchedAt.getTime();

              if (ageMs > maxAgeMs) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse it, it's probably corrupted, so remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to remove old metadata:', key, error);
        }
      });

      console.log(`Cleared ${keysToRemove.length} old paper metadata entries`);
    } catch (error) {
      console.warn('Failed to clear old metadata:', error);
    }
  }

  /**
   * Clear all paper metadata from localStorage
   */
  static clearAll(): void {
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to remove metadata:', key, error);
        }
      });

      console.log(`Cleared ${keysToRemove.length} paper metadata entries`);
    } catch (error) {
      console.warn('Failed to clear all metadata:', error);
    }
  }

  /**
   * Create metadata object from arXiv API response
   */
  static createFromArxivResponse(data: any, originalUrl: string, displayUrl: string): PaperMetadata {
    return {
      title: data.title || '',
      authors: data.authors || [],
      abstract: data.abstract || '',
      arxivId: data.arxivId,
      url: originalUrl,
      displayUrl,
      fetchedAt: new Date(),
    };
  }

  /**
   * Create basic metadata for non-arXiv URLs
   */
  static createBasic(url: string, displayUrl: string): PaperMetadata {
    return {
      title: displayUrl,
      authors: [],
      abstract: '',
      url,
      displayUrl,
      fetchedAt: new Date(),
    };
  }
}
