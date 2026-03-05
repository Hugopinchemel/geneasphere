import { readBody } from 'h3'
import { compare, hash } from 'bcryptjs'
import { UserModel } from '~~/server/models/User'

jest.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: jest.fn(),
  createError: jest.fn((opts: any) => {
    const e: any = new Error(opts.statusMessage)
    e.statusCode = opts.statusCode
    e.statusMessage = opts.statusMessage
    return e
  })
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))

jest.mock('~~/server/utils/db', () => ({
  connectToDB: jest.fn()
}))

jest.mock('~~/server/models/User', () => ({
  UserModel: { findById: jest.fn() }
}))

const mockReadBody = readBody as jest.MockedFunction<typeof readBody>
const mockCompare = compare as jest.MockedFunction<any>
const mockHash = hash as jest.MockedFunction<any>
const mockFindById = UserModel.findById as jest.MockedFunction<any>

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('~~/server/api/auth/password.put').default

describe('PUT /api/auth/password', () => {
  const mockEvent = {}

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).getUserSession = jest.fn()
  })

  it('throws 401 when no session exists', async () => {
    ;(global as any).getUserSession.mockResolvedValue({})
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when current password is missing', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ new: 'newpass123' })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when new password is missing', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ current: 'currentpass' })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when new password is shorter than 8 characters', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ current: 'currentpass', new: 'short' })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when user is not found', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ current: 'currentpass', new: 'newpassword123' })
    mockFindById.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 401 when current password is incorrect', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ current: 'wrongpass', new: 'newpassword123' })
    mockFindById.mockResolvedValue({ password: 'hashed', save: jest.fn() })
    mockCompare.mockResolvedValue(false)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('hashes new password and returns ok on success', async () => {
    const mockUser = { password: 'oldhash', save: jest.fn() }
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'uid' } })
    mockReadBody.mockResolvedValue({ current: 'currentpass', new: 'newpassword123' })
    mockFindById.mockResolvedValue(mockUser)
    mockCompare.mockResolvedValue(true)
    mockHash.mockResolvedValue('newhash')

    const result = await handler(mockEvent)

    expect(result).toEqual({ ok: true })
    expect(mockHash).toHaveBeenCalledWith('newpassword123', 10)
    expect(mockUser.password).toBe('newhash')
    expect(mockUser.save).toHaveBeenCalled()
  })
})
