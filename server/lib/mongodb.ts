import { attachDatabasePool } from "@vercel/functions"
import type { MongoClientOptions } from "mongodb"
import { MongoClient } from "mongodb"

const { uri, dbName, appName } = useRuntimeConfig().mongo

const options: MongoClientOptions = {
  appName: appName || "sempurna-baja-dev",
}
export const DB_NAME = dbName || "sempurna-baja"

let client: MongoClient
// eslint-disable-next-line import/no-mutable-exports
let clientPromise: Promise<MongoClient> | null = null

if ( uri ) {
  if ( process.env.NODE_ENV === "development" ) {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    }

    if ( !globalWithMongo._mongoClientPromise ) {
      client = new MongoClient( uri, options )

      attachDatabasePool( client )
      
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient( uri, options )
    attachDatabasePool( client )

    clientPromise = client.connect()
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise 