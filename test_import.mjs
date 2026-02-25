async function test() {
  try {
    const path1 = 'file://C:/Users/Nebula/WebstormProjects/geneasphere/.nuxt/dist/server/server.mjs'
    const path2 = 'file://C:/Users/Nebula/WebstormProjects/geneasphere/.nuxt//dist/server/server.mjs'

    console.log('Testing path 1:', path1)
    try {
      await import(path1)
      console.log('Path 1 works')
    } catch (e) {
      console.log('Path 1 failed:', e.message)
    }

    console.log('Testing path 2:', path2)
    try {
      await import(path2)
      console.log('Path 2 works')
    } catch (e) {
      console.log('Path 2 failed:', e.message)
    }
  } catch (err) {
    console.error(err)
  }
}

test()
