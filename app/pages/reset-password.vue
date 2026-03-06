<script lang="ts" setup>
definePageMeta({ layout: 'auth' })

const route = useRoute()
const toast = useToast()

const token = computed(() => (route.query.token as string) || '')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const done = ref(false)

const error = computed(() => {
  if (password.value.length > 0 && password.value.length < 8) {
    return 'Au moins 8 caractères requis'
  }
  if (passwordConfirm.value.length > 0 && password.value !== passwordConfirm.value) {
    return 'Les mots de passe ne correspondent pas'
  }
  return null
})

const canSubmit = computed(() =>
  password.value.length >= 8
  && password.value === passwordConfirm.value
  && !loading.value
)

async function onSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value }
    })
    done.value = true
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Erreur',
      description: e?.data?.statusMessage || 'Lien invalide ou expiré',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
    <NuxtLink class="flex items-center gap-2 text-dimmed hover:text-highlighted transition-colors" to="/">
      <UIcon class="size-5 text-primary" name="i-lucide-git-fork" />
      <span class="font-semibold text-sm">GeneaSphere</span>
    </NuxtLink>

    <UCard class="w-full max-w-sm" :ui="{ body: 'p-8' }">
      <!-- Pas de token -->
      <div v-if="!token" class="flex flex-col items-center gap-4 text-center">
        <div class="p-3 rounded-full bg-error/10">
          <UIcon class="size-8 text-error" name="i-lucide-link-off" />
        </div>
        <p class="font-semibold">
          Lien invalide
        </p>
        <p class="text-sm text-dimmed">
          Ce lien de réinitialisation est incorrect ou a expiré.
        </p>
        <UButton color="primary" label="Retour à la connexion" to="/login" />
      </div>

      <!-- Succès -->
      <div v-else-if="done" class="flex flex-col items-center gap-4 text-center">
        <div class="p-3 rounded-full bg-success/10">
          <UIcon class="size-8 text-success" name="i-lucide-check-circle" />
        </div>
        <p class="font-semibold">
          Mot de passe mis à jour
        </p>
        <p class="text-sm text-dimmed">
          Votre mot de passe a été réinitialisé avec succès.
        </p>
        <UButton color="primary" label="Se connecter" to="/login" />
      </div>

      <!-- Formulaire -->
      <div v-else class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h1 class="text-lg font-bold text-highlighted">
            Nouveau mot de passe
          </h1>
          <p class="text-sm text-dimmed">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
          <UFormField label="Nouveau mot de passe" required>
            <UInput
              v-model="password"
              class="w-full"
              placeholder="••••••••"
              type="password"
            />
          </UFormField>

          <UFormField label="Confirmer le mot de passe" required>
            <UInput
              v-model="passwordConfirm"
              class="w-full"
              placeholder="••••••••"
              type="password"
            />
          </UFormField>

          <p v-if="error" class="text-sm text-error">
            {{ error }}
          </p>

          <UButton
            :disabled="!canSubmit"
            :loading="loading"
            block
            color="primary"
            label="Réinitialiser le mot de passe"
            type="submit"
          />
        </form>

        <p class="text-center text-xs text-dimmed">
          <NuxtLink class="text-primary hover:underline" to="/login">
            Retour à la connexion
          </NuxtLink>
        </p>
      </div>
    </UCard>
  </div>
</template>



