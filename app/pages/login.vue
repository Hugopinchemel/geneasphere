<script lang="ts" setup>
definePageMeta({ layout: 'auth' })

const router = useRouter()
const route = useRoute()
const toast = useToast()
const loading = ref(false)

const fields = [
  { name: 'email', label: 'Adresse e-mail', type: 'email', placeholder: 'vous@exemple.com', required: true },
  { name: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••', required: true }
]
const providers = [
  {
    label: 'Continuer avec Google',
    icon: 'i-simple-icons-google',
    color: 'neutral' as const,
    onClick: () => { window.location.href = '/auth/google' }
  }
]
const { fetch: fetchSession } = useUserSession()

const oauthErrorMessages: Record<string, string> = {
  google: 'Échec de la connexion Google. Vérifiez la console serveur pour les détails.',
  server: 'Erreur serveur lors de la connexion Google.',
  no_email: 'Google n\'a pas fourni d\'adresse e-mail.'
}

onMounted(() => {
  const error = route.query.error as string
  if (error) {
    const msg = oauthErrorMessages[error] || `Erreur OAuth : ${error}`
    toast.add({ title: 'Connexion Google échouée', description: msg, color: 'error', duration: 8000 })
  }
})

async function onSubmit(payload: unknown) {
  const event = payload as { data?: Record<string, string> }
  const data = event.data ?? (payload as Record<string, string>)

  // Récupérer les valeurs directement du DOM pour gérer l'autofill du navigateur
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement

  const email = data.email || emailInput?.value || ''
  const password = data.password || passwordInput?.value || ''

  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    await fetchSession()
    await router.replace((route.query.redirect as string) || '/')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    const msg = e?.data?.statusMessage || 'Identifiants invalides'
    toast.add({ title: 'Connexion échouée', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}

// ─── Mot de passe oublié ──────────────────────────────────────────────────────
const forgotOpen = ref(false)
const forgotEmail = ref('')
const forgotLoading = ref(false)
const forgotSent = ref(false)

async function onForgotSubmit() {
  if (!forgotEmail.value) return
  forgotLoading.value = true
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: forgotEmail.value }
    })
    forgotSent.value = true
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'envoyer l\'email', color: 'error' })
  } finally {
    forgotLoading.value = false
  }
}

function openForgot() {
  forgotEmail.value = ''
  forgotSent.value = false
  forgotOpen.value = true
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
      :submit="{ label: 'Se connecter' }"
      icon="i-lucide-log-in"
      title="Connexion"
      :on-submit="onSubmit"
    >
      <template #description>
        Pas encore de compte ?
        <NuxtLink class="text-primary hover:underline font-medium" to="/register">Créer un compte</NuxtLink>
      </template>

      <template #footer>
        <button
          class="text-xs text-dimmed hover:text-primary transition-colors underline underline-offset-2"
          type="button"
          @click="openForgot"
        >
          Mot de passe oublié ?
        </button>
      </template>
    </UAuthForm>

    <!-- Modal mot de passe oublié -->
    <UModal v-model:open="forgotOpen" title="Mot de passe oublié">
      <template #body>
        <!-- Succès -->
        <div v-if="forgotSent" class="flex flex-col items-center gap-4 text-center py-2">
          <div class="p-3 rounded-full bg-success/10">
            <UIcon class="size-8 text-success" name="i-lucide-mail-check" />
          </div>
          <p class="font-semibold">
            Email envoyé
          </p>
          <p class="text-sm text-dimmed max-w-xs">
            Si un compte existe pour <span class="font-medium text-highlighted">{{ forgotEmail }}</span>,
            vous recevrez un lien de réinitialisation valable 1 heure.
          </p>
          <UButton
            color="primary"
            label="Fermer"
            variant="soft"
            @click="forgotOpen = false"
          />
        </div>

        <!-- Formulaire -->
        <form v-else class="flex flex-col gap-4" @submit.prevent="onForgotSubmit">
          <p class="text-sm text-dimmed">
            Entrez votre adresse e-mail. Vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>
          <UFormField label="Adresse e-mail" required>
            <UInput
              v-model="forgotEmail"
              autofocus
              class="w-full"
              placeholder="vous@exemple.com"
              type="email"
            />
          </UFormField>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              label="Annuler"
              variant="subtle"
              @click="forgotOpen = false"
            />
            <UButton
              :disabled="!forgotEmail"
              :loading="forgotLoading"
              color="primary"
              icon="i-lucide-send"
              label="Envoyer le lien"
              type="submit"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
