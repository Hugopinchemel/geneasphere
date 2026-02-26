<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user } = useUserSession()

const brandTeam = {
  label: 'Geneasphere',
  avatar: {
    icon: 'i-lucide-globe',
    alt: 'Geneasphere'
  }
}

const teams = computed(() => {
  const u = user.value as { name?: string, avatar?: string } | null
  return [
    brandTeam,
    {
      label: u?.name || 'Personal',
      avatar: {
        src: u?.avatar || '',
        alt: u?.name || 'Personal'
      }
    }
  ]
})

const selectedTeam = computed(() => brandTeam)

const items = computed<DropdownMenuItem[][]>(() => {
  return [teams.value, [{
    label: 'Create team',
    icon: 'i-lucide-circle-plus'
  }, {
    label: 'Manage teams',
    icon: 'i-lucide-cog'
  }]]
})
</script>

<template>
  <UDropdownMenu
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :class="[!collapsed && 'py-2']"
      :square="collapsed"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
      block
      class="data-[state=open]:bg-elevated"
      color="neutral"
      v-bind="{
        ...selectedTeam,
        label: collapsed ? undefined : selectedTeam?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
