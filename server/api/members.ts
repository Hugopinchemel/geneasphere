const members = [{
  name: 'Anthony Fu',
  username: 'antfu',
  role: 'member',
  avatar: {src: 'https://ipx.nuxt.com/f_auto,s_192x192/gh_avatar/antfu'}
}]

export default eventHandler(async () => {
  return members
})
