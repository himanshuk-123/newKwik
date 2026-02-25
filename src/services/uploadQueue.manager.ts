/**
 * Upload Queue Manager - Stub for offline mode
 * Upload queue functionality disabled for now
 */

class UploadQueueManager {
  subscribe(callback: (count: number) => void): () => void {
    // Feature disabled - will enable later
    return () => {}; // Unsubscribe function
  }

  async getQueueCount(): Promise<number> {
    // Feature disabled - will enable later
    return 0;
  }
}

export const uploadQueueManager = new UploadQueueManager();
