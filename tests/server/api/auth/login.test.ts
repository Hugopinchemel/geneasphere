import { readBody, createError } from 'h3'
import { compare } from 'bcryptjs'
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
  compare: jest.fn()
}))

jest.mock('~~/server/utils/db', () => ({
  connectToDB: jest.fn()
}))

jest.mock('~~/server/models/User', () => ({
  UserModel: { findOne: jest.fn() }
}))

jest.mock('~~/server/models/Team', () => ({
  TeamModel: { findOne: jest.fn() }
}))

const mockReadBody = readBody as jest.MockedFunction<typeof readBody>
const mockCompare = compare as jest.MockedFunction<any>
const mockFindOne = UserModel.findOne as jest.MockedFunction<any>

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('~~/server/api/auth/login.post').default

describe('POST /api/auth/login', () => {
  const mockEvent = {}

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).setUserSession = jest.fn()
  })

  it('throws 400 when email is missing', async () => {
    mockReadBody.mockResolvedValue({ password: 'pass123' })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when password is missing', async () => {
    mockReadBody.mockResolvedValue({ email: 'test@example.com' })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when both fields are missing', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when user is not found', async () => {
    mockReadBody.mockResolvedValue({ email: 'notfound@example.com', password: 'pass123' })
    mockFindOne.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when password does not match', async () => {
    mockReadBody.mockResolvedValue({ email: 'test@example.com', password: 'wrong' })
    mockFindOne.mockResolvedValue({ _id: 'uid', password: 'hashed', currentTeamId: 'tid', save: jest.fn() })
    mockCompare.mockResolvedValue(false)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('normalises email to lowercase and trims whitespace', async () => {
    mockReadBody.mockResolvedValue({ email: '  TEST@EXAMPLE.COM  ', password: 'pass123' })
    mockFindOne.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('returns user data and sets session on successful login', async () => {
    const mockUser = {
      _id: { toString: () => 'user123' },
      name: 'Alice',
      email: 'alice@example.com',
      avatar: null,
      theme: 'dark',
      primaryColor: 'green',
      neutralColor: 'zinc',
      currentTeamId: 'team1',
      save: jest.fn()
    }
    mockReadBody.mockResolvedValue({ email: 'alice@example.com', password: 'correct' })
    mockFindOne.mockResolvedValue(mockUser)
    mockCompare.mockResolvedValue(true)

    const result = await handler(mockEvent)

    expect(result.user.id).toBe('user123')
    expect(result.user.email).toBe('alice@example.com')
    expect((global as any).setUserSession).toHaveBeenCalledWith(
      mockEvent,
      expect.objectContaining({ user: expect.objectContaining({ id: 'user123' }) })
    )
  })
})
