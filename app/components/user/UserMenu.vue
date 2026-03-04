<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const { user, loggedIn, clear, fetch: fetchSession } = useUserSession()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const userDisplay = computed(() => {
  const u = user.value as { name?: string, avatar?: string } | null
  return {
    name: u?.name || 'User',
    avatar: u?.avatar || ''
  }
})

async function savePreferences(prefs: { theme?: string, primaryColor?: string, neutralColor?: string }) {
  try {
    await $fetch('/api/auth/preferences', { method: 'PUT', body: prefs })
    await fetchSession()
  } catch {
    // silently fail
  }
}

// Restaurer les préférences depuis la session utilisateur au montage
onMounted(() => {
  const u = user.value as { theme?: string, primaryColor?: string, neutralColor?: string } | null
  if (u?.theme) {
    colorMode.preference = u.theme
  }
  if (u?.primaryColor) {
    appConfig.ui.colors.primary = u.primaryColor
  }
  if (u?.neutralColor) {
    appConfig.ui.colors.neutral = u.neutralColor
  }
})

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: userDisplay.value.name,
  avatar: { src: userDisplay.value.avatar, alt: userDisplay.value.name }
}], [{
  label: 'Profile',
  icon: 'i-lucide-user',
  to: '/settings'
}], [{
  label: 'Theme',
  icon: 'i-lucide-palette',
  children: [{
    label: 'Primary',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e) => {
        e.preventDefault()
        appConfig.ui.colors.primary = color
        savePreferences({ primaryColor: color })
      }
    }))
  }, {
    label: 'Neutral',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e) => {
        e.preventDefault()
        appConfig.ui.colors.neutral = color
        savePreferences({ neutralColor: color })
      }
    }))
  }]
}, {
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
      savePreferences({ theme: 'light' })
    }
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
      savePreferences({ theme: 'dark' })
    }
  }]
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect: async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  }
}]]))
</script>

<template>
  <UDropdownMenu
    v-if="loggedIn"
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :square="collapsed"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
      block
      class="data-[state=open]:bg-elevated"
      color="neutral"
      variant="ghost"
    >
      <UAvatar :alt="userDisplay.name" :src="userDisplay.avatar" size="2xs" />
      <span v-if="!collapsed" class="truncate text-left flex-1">{{ userDisplay.name }}</span>
      <UIcon v-if="!collapsed" class="text-dimmed shrink-0" name="i-lucide-chevrons-up-down" />
    </UButton>

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
        />
      </div>
    </template>
  </UDropdownMenu>

  <UButton
    v-else
    :label="collapsed ? undefined : 'Sign in'"
    :square="collapsed"
    block
    color="primary"
    icon="i-lucide-log-in"
    to="/login"
    variant="soft"
  />
</template>
