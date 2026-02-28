<script lang="ts" setup>
definePageMeta({ layout: 'auth' })

const router = useRouter()
const route = useRoute()
const toast = useToast()
const loading = ref(false)
const form = reactive({ name: '', email: '', password: '' })
const { fetch: fetchSession } = useUserSession()

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: form
    })
    await fetchSession()
    router.replace((route.query.redirect as string) || '/')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    const msg = e?.data?.statusMessage || 'Registration failed'
    toast.add({ title: 'Sign up failed', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
    <!-- Logo retour -->
    <NuxtLink class="flex items-center gap-2 text-dimmed hover:text-highlighted transition-colors" to="/">
      <UIcon class="size-5 text-primary" name="i-lucide-git-fork" />
      <span class="font-semibold text-sm">GeneaSphere</span>
    </NuxtLink>

    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon class="size-5 text-primary" name="i-lucide-user-plus" />
          <h1 class="text-xl font-semibold">
            Créer un compte
          </h1>
        </div>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField label="Nom" name="name">
          <UInput
            v-model="form.name"
            placeholder="Jean Dupont"
            required
            type="text"
          />
        </UFormField>
        <UFormField label="Adresse e-mail" name="email">
          <UInput
            v-model="form.email"
            placeholder="vous@exemple.com"
            required
            type="email"
          />
        </UFormField>
        <UFormField label="Mot de passe" name="password">
          <UInput
            v-model="form.password"
            placeholder="••••••••"
            required
            type="password"
          />
        </UFormField>
        <UButton
          :loading="loading"
          block
          type="submit"
        >
          Créer mon compte
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-dimmed">
          Déjà un compte ?
          <NuxtLink class="text-primary hover:underline" to="/login">Se connecter</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
