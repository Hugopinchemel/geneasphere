<script lang="ts" setup>
import { format, isToday } from 'date-fns'
import type { Mail } from '~/types'

const props = defineProps<{
  mails: Mail[]
}>()

const mailsRefs = ref<Record<number, Element | null>>({})
const selectedMail = defineModel<Mail | null>()

watch(selectedMail, () => {
  if (!selectedMail.value) return
  const el = mailsRefs.value[selectedMail.value.uid]
  if (el) el.scrollIntoView({ block: 'nearest' })
})

defineShortcuts({
  arrowdown: () => {
    const index = props.mails.findIndex(m => m.uid === selectedMail.value?.uid)
    selectedMail.value = index === -1
      ? props.mails[0]
      : props.mails[index + 1] ?? selectedMail.value
  },
  arrowup: () => {
    const index = props.mails.findIndex(m => m.uid === selectedMail.value?.uid)
    selectedMail.value = index <= 0
      ? props.mails[props.mails.length - 1]
      : props.mails[index - 1] ?? selectedMail.value
  }
})

function senderName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1]!.trim() : from
}
</script>

<template>
  <div class="overflow-y-auto divide-y divide-default">
    <div
      v-for="mail in mails"
      :key="mail.uid"
      :ref="(el) => { mailsRefs[mail.uid] = el as Element | null }"
    >
      <div
        :class="[
          mail.unread ? 'text-highlighted' : 'text-toned',
          selectedMail?.uid === mail.uid
            ? 'border-primary bg-primary/10'
            : 'border-bg hover:border-primary hover:bg-primary/5'
        ]"
        class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
        @click="selectedMail = mail"
      >
        <div :class="[mail.unread && 'font-semibold']" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            {{ senderName(mail.from) }}
            <UChip v-if="mail.unread" />
          </div>
          <span class="text-xs text-dimmed shrink-0">
            {{ isToday(new Date(mail.date)) ? format(new Date(mail.date), 'HH:mm') : format(new Date(mail.date), 'dd MMM') }}
          </span>
        </div>
        <p :class="[mail.unread && 'font-semibold']" class="truncate">
          {{ mail.subject }}
        </p>
        <p class="text-dimmed line-clamp-1 text-xs mt-0.5">
          {{ mail.body }}
        </p>
        <div v-if="mail.attachments?.length" class="flex items-center gap-1 mt-1">
          <UIcon class="size-3 text-dimmed" name="i-lucide-paperclip" />
          <span class="text-xs text-dimmed">{{ mail.attachments.length }} pièce(s) jointe(s)</span>
        </div>
      </div>
    </div>
    <div v-if="!mails.length" class="flex flex-col items-center justify-center gap-2 py-16 text-dimmed">
      <UIcon class="size-8" name="i-lucide-inbox" />
      <p class="text-sm">
        Aucun message
      </p>
    </div>
  </div>
</template>
