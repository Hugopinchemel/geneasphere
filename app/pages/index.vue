<script lang="ts" setup>
const { loggedIn } = useUserSession()

// Gérer le layout dynamiquement
if (import.meta.client) {
  watch(loggedIn, (isLogged) => {
    setPageLayout(isLogged ? 'default' : 'auth')
  }, { immediate: true })
} else if (import.meta.server) {
  // On the server, we set the layout based on initial loggedIn state
  setPageLayout(loggedIn.value ? 'default' : 'auth')
}

definePageMeta({
  layout: false
})
</script>

<template>
  <DashboardHome v-if="loggedIn" />
  <WelcomeHome v-else />
</template>
