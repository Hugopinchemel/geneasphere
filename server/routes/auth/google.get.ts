import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { TeamModel } from '~~/server/models/Team'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },
  async onSuccess(event, { user: googleUser }) {
    try {
      await connectToDB()

      const email = (googleUser.email || '').toLowerCase().trim()
      if (!email) return sendRedirect(event, '/login?error=no_email')

      let user = await UserModel.findOne({ email })

      if (!user) {
        user = await UserModel.create({
          name: googleUser.name || email.split('@')[0],
          email,
          password: '',
          googleId: googleUser.sub,
          avatar: googleUser.picture || ''
        })

        const team = await TeamModel.create({
          name: `Famille de ${user.name}`,
          owner: user._id,
          members: [user._id]
        })
        user.currentTeamId = (team._id as { toString(): string }).toString()
        await user.save()
      } else if (!user.googleId) {
        user.googleId = googleUser.sub
        if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture
        await user.save()
      } else {
        // compte Google deja lie, rien a faire
      }

      if (!user.currentTeamId) {
        const team = await TeamModel.findOne({ members: user._id })
        if (team) {
          user.currentTeamId = (team._id as { toString(): string }).toString()
          await user.save()
        }
      }

      await setUserSession(event, {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          theme: user.theme || 'dark',
          primaryColor: user.primaryColor || 'green',
          neutralColor: user.neutralColor || 'zinc',
          currentTeamId: user.currentTeamId || ''
        }
      })

      return sendRedirect(event, '/')
    }
    catch {
      return sendRedirect(event, '/login?error=server')
    }
  },
  onError(event) {
    return sendRedirect(event, '/login?error=google')
  }
})
