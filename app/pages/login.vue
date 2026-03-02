<script lang="ts" setup>
definePageMeta({layout: 'auth'})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const loading = ref(false)
const fields = [
  {name: 'email', label: 'Adresse e-mail', type: 'email', placeholder: 'vous@exemple.com', required: true},
  {name: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••', required: true}
]
const providers = [
  {
    label: 'Continuer avec Google',
    icon: 'i-simple-icons-google',
    color: 'neutral' as const,
    onClick: () => { window.location.href = '/auth/google' }
  }
]
const {fetch: fetchSession} = useUserSession()

const oauthErrorMessages: Record<string, string> = {
  google: 'Échec de la connexion Google. Vérifiez la console serveur pour les détails.',
  server: 'Erreur serveur lors de la connexion Google.',
  no_email: 'Google n\'a pas fourni d\'adresse e-mail.'
}

onMounted(() => {
  const error = route.query.error as string
  if (error) {
    const msg = oauthErrorMessages[error] || `Erreur OAuth : ${error}`
    toast.add({title: 'Connexion Google échouée', description: msg, color: 'error', duration: 8000})
    console.error('[Login page] OAuth error from query:', error)
  }
})

async function onSubmit({data}: {data: Record<string, string>}) {
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {email: data.email, password: data.password}
    })
    await fetchSession()
    router.replace((route.query.redirect as string) || '/')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    const msg = e?.data?.statusMessage || 'Identifiants invalides'
    toast.add({title: 'Connexion échouée', description: msg, color: 'error'})
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
    <!-- Logo -->
    <NuxtLink class="flex items-center gap-2 text-dimmed hover:text-highlighted transition-colors" to="/">
      <UIcon class="size-5 text-primary" name="i-lucide-git-fork"/>
      <span class="font-semibold text-sm">GeneaSphere</span>
    </NuxtLink>

    <UAuthForm
      :fields="fields"
      :loading="loading"
      :providers="providers"
      align="top"
      icon="i-lucide-log-in"
      submit-button-options-label="Se connecter"
      title="Connexion"
      @submit="onSubmit"
    >
      <template #description>
        Pas encore de compte ?
        <NuxtLink class="text-primary hover:underline font-medium" to="/register">Créer un compte</NuxtLink>
      </template>
    </UAuthForm>
  </div>
</template>
