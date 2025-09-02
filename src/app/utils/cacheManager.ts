import { PaperMetadataStorage } from './paperMetadata';

/**
 * Utility class for managing all cache operations
 */
export class CacheManager {
  /**
   * Clear all paper metadata from localStorage
   */
  static clearPaperMetadata(): number {
    let clearedCount = 0;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('paper-metadata-')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          clearedCount++;
        } catch (error) {
          console.warn('Failed to remove paper metadata:', key, error);
        }
      });

      console.log(`Cleared ${clearedCount} paper metadata entries`);
    } catch (error) {
      console.warn('Failed to clear paper metadata:', error);
    }

    return clearedCount;
  }

  /**
   * Clear all chat threads from localStorage
   */
  static clearChatThreads(): number {
    let clearedCount = 0;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('chat-threads-') || key.startsWith('chat-history-'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          clearedCount++;
        } catch (error) {
          console.warn('Failed to remove chat data:', key, error);
        }
      });

      console.log(`Cleared ${clearedCount} chat data entries`);
    } catch (error) {
      console.warn('Failed to clear chat data:', error);
    }

    return clearedCount;
  }

  /**
   * Clear all cached data (papers + chat)
   */
  static clearAll(): { papers: number; chats: number; total: number } {
    const papers = this.clearPaperMetadata();
    const chats = this.clearChatThreads();

    const total = papers + chats;
    console.log(`Cache cleared: ${papers} paper entries, ${chats} chat entries (${total} total)`);

    return { papers, chats, total };
  }

  /**
   * Get cache statistics
   */
  static getStats(): { papers: number; chats: number; total: number } {
    let papers = 0;
    let chats = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('paper-metadata-')) {
            papers++;
          } else if (key.startsWith('chat-threads-') || key.startsWith('chat-history-')) {
            chats++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return { papers, chats, total: papers + chats };
  }

  /**
   * Clear old cached data (older than specified hours)
   */
  static clearOld(maxAgeHours: number = 24): { papers: number; chats: number; total: number } {
    // Clear old paper metadata
    PaperMetadataStorage.clearOld(maxAgeHours);

    // For chat data, we could implement similar logic here if needed
    // For now, we'll just return the paper clearing results
    const stats = this.getStats();
    console.log(`Cleared old cache data (${maxAgeHours}h+ old)`);

    return stats;
  }
}
