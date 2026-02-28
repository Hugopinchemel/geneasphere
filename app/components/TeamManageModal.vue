<script lang="ts" setup>
import type { Team, TeamMember } from '~/types'

const props = defineProps<{
  team: Team
}>()

const emit = defineEmits(['refresh'])

const toast = useToast()
const email = ref('')
const inviting = ref(false)

async function inviteMember() {
  if (!email.value.trim()) return
  inviting.value = true
  try {
    await $fetch(`/api/teams/${props.team._id}/members`, {
      method: 'POST',
      body: { email: email.value }
    })
    toast.add({ title: 'Membre ajouté avec succès', color: 'success' })
    email.value = ''
    emit('refresh')
  } catch (err) {
    const error = err as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Erreur',
      description: error.data?.statusMessage || 'Impossible d\'ajouter ce membre',
      color: 'error'
    })
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 py-4">
    <div class="space-y-4">
      <h3 class="text-sm font-medium">
        Inviter un membre
      </h3>
      <form
        class="flex gap-2"
        @submit.prevent="inviteMember"
      >
        <UInput
          v-model="email"
          placeholder="Email de l'utilisateur"
          class="flex-1"
          type="email"
          required
        />
        <UButton
          type="submit"
          label="Inviter"
          :loading="inviting"
        />
      </form>
    </div>

    <div class="space-y-4">
      <h3 class="text-sm font-medium">
        Membres actuels
      </h3>
      <div class="space-y-2">
        <div
          v-for="member in (team.members as TeamMember[])"
          :key="member._id"
          class="flex items-center gap-3 p-2 border border-default rounded-md"
        >
          <UAvatar
            :src="member.avatar"
            :alt="member.name"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ member.name }}
            </p>
            <p class="text-xs text-dimmed truncate">
              {{ member.email }}
            </p>
          </div>
          <UBadge
            v-if="member._id === team.owner"
            variant="subtle"
            size="sm"
          >
            Propriétaire
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
