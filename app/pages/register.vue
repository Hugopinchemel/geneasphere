<script lang="ts" setup>
definePageMeta({ layout: 'auth' })

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const fields = [
  { name: 'name', label: 'Nom', type: 'text', placeholder: 'Jean Dupont', required: true },
  { name: 'email', label: 'Adresse e-mail', type: 'email', placeholder: 'vous@exemple.com', required: true },
  { name: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••', required: true }
]
const providers = [
  {
    label: 'Continuer avec Google',
    icon: 'i-simple-icons-google',
    color: 'neutral' as const,
    onClick: () => {
      navigateTo('/api/auth/google', { external: true })
    }
  }
]
const { fetch: fetchSession } = useUserSession()

async function onSubmit(payload: unknown) {
  const event = payload as { data?: Record<string, string> }
  const data = event.data ?? (payload as Record<string, string>)
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: data.name, email: data.email, password: data.password }
    })
    await fetchSession()
    await router.replace('/onboarding')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    const msg = e?.data?.statusMessage || 'Inscription échouée'
    toast.add({ title: 'Inscription échouée', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
    <!-- Logo -->
    <NuxtLink class="flex items-center gap-2 text-dimmed hover:text-highlighted transition-colors" to="/">
      <UIcon class="size-5 text-primary" name="i-lucide-git-fork" />
      <span class="font-semibold text-sm">GeneaSphere</span>
    </NuxtLink>

    <UAuthForm
      :fields="fields"
      :loading="loading"
      :providers="providers"
      :submit="{ label: 'Créer mon compte' }"
      icon="i-lucide-user-plus"
      title="Créer un compte"
      @submit="onSubmit"
    >
      <template #description>
        Déjà un compte ?
        <NuxtLink class="text-primary hover:underline font-medium" to="/login">Se connecter</NuxtLink>
      </template>
    </UAuthForm>
  </div>
</template>
