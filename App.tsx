/**
 * DATABASE INTEGRATION EXAMPLE FOR App.tsx
 * Copy this code structure into your App.tsx
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { initializeDatabase, getDatabaseStatus } from './src/database';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize database on app startup
   * This runs BEFORE any screens are rendered
   */
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('[APP] Starting app initialization...');

        // Initialize database
        await initializeDatabase();

        // Get status to verify
        const status = await getDatabaseStatus();
        console.log('[APP] Database status:', status);

        setDbReady(true);
      } catch (error) {
        console.error('[APP] Initialization failed:', error);
        setDbError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initDB();
  }, []);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Initializing app...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
          Failed to initialize app
        </Text>
        <Text style={{ color: '#666', marginTop: 10, textAlign: 'center' }}>
          {dbError}
        </Text>
      </View>
    );
  }

  // Database is ready - render main app here
  if (dbReady) {
    return (
      <View style={{ flex: 1 }}>
        {/* Your navigation stack, home screen, etc. */}
        <Text>App is ready! Database initialized.</Text>
        {/* Replace above with your actual navigation */}
      </View>
    );
  }

  return null;
}

/**
 * ============================================================================
 * NEXT STEPS
 * ============================================================================
 *
 * 1. Install dependencies:
 *    npm install react-native-sqlite-storage uuid
 *
 * 2. Copy the database folder structure:
 *    src/database/
 *    ├── database.ts
 *    ├── migrations/index.ts
 *    ├── types.ts
 *    ├── queries.ts
 *    └── index.ts
 *
 * 3. Update this App.tsx with the initialization code above
 *
 * 4. Now you can use database queries in your features:
 *
 *    import { leadQueries, syncQueueQueries } from './src/database';
 *
 *    // Create a lead
 *    await leadQueries.create({
 *      id: 'lead-123',
 *      prospect_name: 'John Doe',
 *      company_id: 'comp-1',
 *      status: 'draft',
 *      is_synced: 0,
 *    });
 *
 *    // Get all leads (works offline)
 *    const leads = await leadQueries.getAll();
 *
 * ============================================================================
 */
