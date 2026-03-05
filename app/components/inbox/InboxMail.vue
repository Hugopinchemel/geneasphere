<script lang="ts" setup>
import { format } from 'date-fns'
import type { Mail } from '~/types'

defineProps<{
  mail: Mail
}>()

const emit = defineEmits<{
  close: []
}>()

function senderName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1]!.trim() : from
}

function senderEmail(from: string) {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}
</script>

<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="mail.subject" :toggle="false">
      <template #leading>
        <UButton
          class="-ms-1.5"
          color="neutral"
          icon="i-lucide-x"
          variant="ghost"
          @click="emit('close')"
        />
      </template>
    </UDashboardNavbar>

    <!-- En-tête expéditeur -->
    <div class="flex flex-col sm:flex-row justify-between gap-1 p-4 sm:px-6 border-b border-default">
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar :alt="senderName(mail.from)" size="3xl" />
        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ senderName(mail.from) }}
          </p>
          <p class="text-muted text-sm">
            {{ senderEmail(mail.from) }}
          </p>
          <p v-if="mail.cc" class="text-dimmed text-xs mt-0.5">
            Cc : {{ mail.cc }}
          </p>
        </div>
      </div>
      <p class="max-sm:pl-16 text-muted text-sm sm:mt-2 shrink-0">
        {{ format(new Date(mail.date), 'dd MMM yyyy HH:mm') }}
      </p>
    </div>

    <!-- Corps du message -->
    <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="mail.html" class="prose prose-sm dark:prose-invert max-w-none" v-html="mail.html" />
      <p v-else class="whitespace-pre-wrap text-sm">
        {{ mail.body }}
      </p>
    </div>

    <!-- Pièces jointes -->
    <div v-if="mail.attachments?.length" class="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
      <div
        v-for="att in mail.attachments"
        :key="att.filename"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-default bg-elevated text-sm"
      >
        <UIcon class="size-4 text-dimmed" name="i-lucide-paperclip" />
        <span class="truncate max-w-32">{{ att.filename }}</span>
      </div>
    </div>
  </UDashboardPanel>
</template>
