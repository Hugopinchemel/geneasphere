import { readBody } from 'h3'
import { TeamModel } from '~~/server/models/Team'
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

jest.mock('~~/server/utils/db', () => ({
  connectToDB: jest.fn()
}))

jest.mock('~~/server/models/Team', () => ({
  TeamModel: { findById: jest.fn() }
}))

jest.mock('~~/server/models/User', () => ({
  UserModel: { findOne: jest.fn() }
}))

const mockReadBody = readBody as jest.MockedFunction<typeof readBody>
const mockTeamFindById = TeamModel.findById as jest.MockedFunction<any>
const mockUserFindOne = UserModel.findOne as jest.MockedFunction<any>

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handler = require('~~/server/api/teams/[id]/members.post').default

describe('POST /api/teams/:id/members', () => {
  const ownerId = 'owner123'
  const mockEvent = { context: { params: { id: 'team123' } } }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).getUserSession = jest.fn()
  })

  it('throws 401 when not authenticated', async () => {
    ;(global as any).getUserSession.mockResolvedValue({})
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when email is missing', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: ownerId } })
    mockReadBody.mockResolvedValue({})
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when team does not exist', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: ownerId } })
    mockReadBody.mockResolvedValue({ email: 'new@example.com' })
    mockTeamFindById.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when requester is not the team owner', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: 'notowner' } })
    mockReadBody.mockResolvedValue({ email: 'new@example.com' })
    mockTeamFindById.mockResolvedValue({ owner: { toString: () => ownerId }, members: [] })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when the user to add does not exist', async () => {
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: ownerId } })
    mockReadBody.mockResolvedValue({ email: 'ghost@example.com' })
    mockTeamFindById.mockResolvedValue({ owner: { toString: () => ownerId }, members: [] })
    mockUserFindOne.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('adds a new member to the team', async () => {
    const mockTeam = {
      owner: { toString: () => ownerId },
      members: [],
      push: jest.fn(),
      save: jest.fn()
    }
    mockTeam.members.map = Array.prototype.map.bind(mockTeam.members)
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: ownerId } })
    mockReadBody.mockResolvedValue({ email: 'new@example.com' })
    mockTeamFindById.mockResolvedValue(mockTeam)
    mockUserFindOne.mockResolvedValue({ _id: { toString: () => 'newuser1' } })

    const result = await handler(mockEvent)

    expect(result.success).toBe(true)
    expect(mockTeam.save).toHaveBeenCalled()
  })

  it('does not add a member who is already in the team', async () => {
    const existingMemberId = 'existinguser1'
    const mockTeam = {
      owner: { toString: () => ownerId },
      members: [{ toString: () => existingMemberId }],
      push: jest.fn(),
      save: jest.fn()
    }
    ;(global as any).getUserSession.mockResolvedValue({ user: { id: ownerId } })
    mockReadBody.mockResolvedValue({ email: 'existing@example.com' })
    mockTeamFindById.mockResolvedValue(mockTeam)
    mockUserFindOne.mockResolvedValue({ _id: { toString: () => existingMemberId } })

    const result = await handler(mockEvent)

    expect(result.success).toBe(true)
    expect(mockTeam.push).not.toHaveBeenCalled()
    expect(mockTeam.save).not.toHaveBeenCalled()
  })
})
