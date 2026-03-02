<script lang="ts" setup>
const {loggedIn} = useUserSession()

// Gérer le layout dynamiquement
watch(loggedIn, (isLogged) => {
  setPageLayout(isLogged ? 'default' : 'auth')
}, {immediate: true})

definePageMeta({
  layout: false
})
</script>

<template>
  <DashboardHome v-if="loggedIn"/>
  <WelcomeHome v-else/>
</template>
