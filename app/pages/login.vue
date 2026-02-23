<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const router = useRouter()
const route = useRoute()
const toast = useToast()
const loading = ref(false)
const form = reactive({ email: '', password: '' })
const { fetch: fetchSession } = useUserSession()

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form
    })
    await fetchSession()
    router.replace((route.query.redirect as string) || '/')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    const msg = e?.data?.statusMessage || 'Invalid credentials'
    toast.add({ title: 'Login failed', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">
          Sign in
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
          />
        </UFormField>
        <UButton
          type="submit"
          :loading="loading"
          block
        >
          Sign in
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-gray-500">
          Don’t have an account?
          <NuxtLink class="text-primary" to="/register">Create one</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
