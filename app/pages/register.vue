<script setup lang="ts">
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
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">
          Create your account
        </h1>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="form.name"
            type="text"
            placeholder="Jane Doe"
            required
          />
        </UFormField>
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
          Create account
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-gray-500">
          Already have an account?
          <NuxtLink class="text-primary" to="/login">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
