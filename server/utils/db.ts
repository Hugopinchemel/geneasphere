import mongoose from 'mongoose'

// Utiliser le cache global Nitro pour éviter les reconnexions entre hot-reloads dev
const globalWithMongoose = globalThis as typeof globalThis & { _mongoose?: typeof mongoose }

export async function connectToDB() {
  // Déjà connecté
  if (mongoose.connection.readyState === 1) return mongoose

  // Cache global (survit aux hot-reloads en dev)
  if (globalWithMongoose._mongoose) return globalWithMongoose._mongoose

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  })

  globalWithMongoose._mongoose = mongoose
  return mongoose
}
