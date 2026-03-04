import { createError, defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data || !file.type) {
    throw createError({ statusCode: 400, statusMessage: 'No file found in form data' })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'File type not allowed. Use JPG, PNG, GIF or WebP.' })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File too large. Max 5MB.' })
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`

  const uploadDir = path.join(path.resolve('.'), 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })

  const filepath = path.join(uploadDir, filename)
  await fs.writeFile(filepath, file.data)

  return {
    url: `/uploads/${filename}`
  }
})
