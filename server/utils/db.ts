import mongoose from 'mongoose'

let cached: typeof mongoose | null = null

export async function connectToDB() {
  if (cached) return cached

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  if (mongoose.connection.readyState === 1) {
    cached = mongoose
    return cached
  }

  await mongoose.connect(uri)
  cached = mongoose
  return cached
}
