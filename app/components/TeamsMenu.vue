<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Team, User } from '~/types'

defineProps<{
  collapsed?: boolean
}>()

const { user, fetch: fetchSession } = useUserSession()

const { data: teamsData, refresh: refreshTeams } = await useFetch<Team[]>('/api/teams')

const teams = computed(() => {
  return (teamsData.value || []).map(t => ({
    label: t.name,
    id: t._id,
    avatar: {
      icon: 'i-lucide-users',
      alt: t.name
    },
    onSelect: () => switchTeam(t._id)
  }))
})

const selectedTeam = computed(() => {
  const currentId = (user.value as User & { currentTeamId: string })?.currentTeamId
  return teams.value.find(t => t.id === currentId) || teams.value[0]
})

async function switchTeam(teamId: string) {
  try {
    await $fetch('/api/teams/current', {
      method: 'PUT',
      body: { teamId }
    })
    await fetchSession()
    // Reload page to refresh all data linked to the team
    window.location.reload()
  } catch (err) {
    console.error('Failed to switch team', err)
  }
}

const showCreateModal = ref(false)
const showManageModal = ref(false)
const newTeamName = ref('')
const creating = ref(false)

async function createTeam() {
  if (!newTeamName.value.trim()) return
  creating.value = true
  try {
    await $fetch('/api/teams', {
      method: 'POST',
      body: { name: newTeamName.value }
    })
    newTeamName.value = ''
    showCreateModal.value = false
    await refreshTeams()
    await fetchSession()
    window.location.reload()
  } catch (err) {
    console.error('Failed to create team', err)
  } finally {
    creating.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => {
  return [
    teams.value,
    [{
      label: 'Gérer l\'équipe',
      icon: 'i-lucide-users',
      onSelect: () => { showManageModal.value = true }
    }, {
      label: 'Créer une équipe',
      icon: 'i-lucide-circle-plus',
      onSelect: () => { showCreateModal.value = true }
    }]
  ]
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

  <UModal v-model:open="showCreateModal" title="Créer une nouvelle équipe">
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="createTeam"
      >
        <UFormField label="Nom de l'équipe">
          <UInput v-model="newTeamName" placeholder="Ex: Famille Martin" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="showCreateModal = false" />
          <UButton type="submit" label="Créer" :loading="creating" />
        </div>
      </form>
    </template>
  </UModal>

  <UModal
    v-if="teamsData?.find(t => t._id === (user as User & { currentTeamId: string })?.currentTeamId)"
    v-model:open="showManageModal"
    title="Gérer l'équipe"
  >
    <template #body>
      <TeamManageModal
        :team="teamsData.find(t => t._id === (user as User & { currentTeamId: string })?.currentTeamId)!"
        @refresh="refreshTeams"
      />
    </template>
  </UModal>
</template>
