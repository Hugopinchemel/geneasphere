import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { TeamModel } from '~~/server/models/Team'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },
  async onSuccess(event, { user: googleUser, tokens }) {
    console.log('[Google OAuth] ✅ onSuccess triggered')
    console.log('[Google OAuth] googleUser:', JSON.stringify(googleUser, null, 2))
    console.log('[Google OAuth] tokens:', JSON.stringify({ access_token: tokens.access_token ? '***set***' : 'MISSING', token_type: tokens.token_type }, null, 2))

    try {
      await connectToDB()
      console.log('[Google OAuth] ✅ DB connected')

      const email = (googleUser.email || '').toLowerCase().trim()
      console.log('[Google OAuth] email:', email)

      if (!email) {
        console.error('[Google OAuth] ❌ No email returned by Google')
        return sendRedirect(event, '/login?error=no_email')
      }

      let user = await UserModel.findOne({ email })
      console.log('[Google OAuth] existing user found:', !!user)

      if (!user) {
        console.log('[Google OAuth] Creating new user...')
        user = await UserModel.create({
          name: googleUser.name || email.split('@')[0],
          email,
          password: '',
          googleId: googleUser.sub,
          avatar: googleUser.picture || ''
        })
        console.log('[Google OAuth] ✅ User created:', user._id.toString())

        console.log('[Google OAuth] Creating default team...')
        const team = await TeamModel.create({
          name: `Famille de ${user.name}`,
          owner: user._id,
          members: [user._id]
        })
        console.log('[Google OAuth] ✅ Team created:', (team._id as { toString(): string }).toString())
        user.currentTeamId = (team._id as { toString(): string }).toString()
        await user.save()
      } else if (!user.googleId) {
        console.log('[Google OAuth] Linking Google account to existing user...')
        user.googleId = googleUser.sub
        if (!user.avatar && googleUser.picture) {
          user.avatar = googleUser.picture
        }
        await user.save()
        console.log('[Google OAuth] ✅ Google account linked')
      } else {
        console.log('[Google OAuth] User already has googleId:', user.googleId)
      }

      if (!user.currentTeamId) {
        console.log('[Google OAuth] No currentTeamId, searching for a team...')
        const team = await TeamModel.findOne({ members: user._id })
        if (team) {
          user.currentTeamId = (team._id as { toString(): string }).toString()
          await user.save()
          console.log('[Google OAuth] ✅ currentTeamId set:', user.currentTeamId)
        } else {
          console.warn('[Google OAuth] ⚠️ No team found for user')
        }
      }

      const safeUser = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        theme: user.theme || 'dark',
        primaryColor: user.primaryColor || 'green',
        neutralColor: user.neutralColor || 'zinc',
        currentTeamId: user.currentTeamId || ''
      }
      console.log('[Google OAuth] safeUser:', JSON.stringify(safeUser, null, 2))

      await setUserSession(event, { user: safeUser })
      console.log('[Google OAuth] ✅ Session set, redirecting to /')
      return sendRedirect(event, '/')
    } catch (err) {
      console.error('[Google OAuth] ❌ Error in onSuccess:', err)
      return sendRedirect(event, '/login?error=server')
    }
  },
  onError(event, error) {
    console.error('[Google OAuth] ❌ onError triggered')
    console.error('[Google OAuth] error:', error)
    return sendRedirect(event, '/login?error=google')
  }
})
