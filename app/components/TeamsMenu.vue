<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user } = useUserSession()

const teams = computed(() => {
  const u = user.value as { name?: string, avatar?: string } | null
  return [{
    label: 'Geneasphere',
    avatar: {
      icon: 'i-lucide-globe',
      alt: 'Geneasphere'
    }
  }, {
    label: u?.name || 'Personal',
    avatar: {
      src: u?.avatar || '',
      alt: u?.name || 'Personal'
    }
  }]
})
const selectedTeam = ref(teams.value[0])

const items = computed<DropdownMenuItem[][]>(() => {
  return [teams.value.map(team => ({
    ...team,
    onSelect() {
      selectedTeam.value = team
    }
  })), [{
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
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...selectedTeam,
        label: collapsed ? undefined : selectedTeam?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
