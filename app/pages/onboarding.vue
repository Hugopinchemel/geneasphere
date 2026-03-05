<script lang="ts" setup>
definePageMeta({ layout: 'auth' })

const router = useRouter()

const currentStep = ref(0)

const steps = [
  {
    icon: 'i-lucide-git-fork',
    title: 'Bienvenue sur GeneaSphere !',
    description: 'GeneaSphere vous permet de construire, visualiser et partager votre arbre généalogique. Découvrons ensemble les fonctionnalités principales.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    detail: null
  },
  {
    icon: 'i-lucide-users',
    title: 'Les Personnes',
    description: 'La section Personnes vous permet d\'ajouter et gérer tous les membres de votre famille.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    detail: {
      items: [
        { icon: 'i-lucide-user-plus', text: 'Ajoutez des membres avec leur prénom, nom, date et lieu de naissance' },
        { icon: 'i-lucide-image', text: 'Importez une photo de profil pour chaque personne' },
        { icon: 'i-lucide-pencil', text: 'Modifiez ou supprimez les informations à tout moment' }
      ]
    }
  },
  {
    icon: 'lucide:link',
    title: 'Les Relations',
    description: 'Les Relations (nœuds matrimoniaux) relient les personnes entre elles pour former votre arbre.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    detail: {
      items: [
        { icon: 'i-lucide-heart', text: 'Créez des unions entre deux personnes (mariage, PACS, relation...)' },
        { icon: 'i-lucide-baby', text: 'Associez des enfants à chaque union pour construire les liens parent-enfant' },
        { icon: 'i-lucide-network', text: 'GeneaSphere fusionne automatiquement les couples dans l\'arbre' }
      ]
    }
  },
  {
    icon: 'i-lucide-tree-pine',
    title: 'L\'Arbre Généalogique',
    description: 'Visualisez votre arbre sous forme graphique interactive depuis la page d\'accueil.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    detail: {
      items: [
        { icon: 'i-lucide-zoom-in', text: 'Naviguez et zoomez dans l\'arbre pour explorer votre famille' },
        { icon: 'i-lucide-mouse-pointer-click', text: 'Cliquez sur un nœud pour voir le détail d\'une personne ou d\'une union' },
        { icon: 'i-lucide-user-round-plus', text: 'Ajoutez des membres directement depuis l\'arbre via le bouton dédié' }
      ]
    }
  },
  {
    icon: 'i-lucide-settings',
    title: 'Les Paramètres',
    description: 'Personnalisez votre espace et gérez votre compte depuis la section Paramètres.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    detail: {
      items: [
        { icon: 'i-lucide-user-cog', text: 'Modifiez votre profil, photo et informations personnelles' },
        { icon: 'i-lucide-bell', text: 'Configurez vos préférences de notifications' },
        { icon: 'i-lucide-shield', text: 'Gérez la sécurité de votre compte (mot de passe)' }
      ]
    }
  }
]

const isLast = computed(() => currentStep.value === steps.length - 1)
const progress = computed(() => Math.round(((currentStep.value) / (steps.length - 1)) * 100))

function next() {
  if (!isLast.value) {
    currentStep.value++
  }
}

function prev() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function finish() {
  router.replace('/')
}
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
    <!-- Logo -->
    <NuxtLink class="flex items-center gap-2 text-dimmed hover:text-highlighted transition-colors" to="/">
      <UIcon class="size-5 text-primary" name="i-lucide-git-fork" />
      <span class="font-semibold text-sm">GeneaSphere</span>
    </NuxtLink>

    <!-- Card principale -->
    <UCard class="w-full max-w-lg" :ui="{ body: 'p-8' }">
      <!-- Barre de progression -->
      <div class="mb-6">
        <div class="flex justify-between text-xs text-dimmed mb-2">
          <span>Étape {{ currentStep + 1 }} sur {{ steps.length }}</span>
          <span>{{ progress }}%</span>
        </div>
        <UProgress :value="progress" color="primary" size="sm" />
      </div>

      <!-- Contenu de l'etape -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-4"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0 -translate-x-4"
        mode="out-in"
      >
        <div :key="currentStep" class="space-y-5">
          <!-- Icône -->
          <div class="flex justify-center">
            <div :class="[steps[currentStep].bg, 'rounded-2xl p-5 inline-flex']">
              <UIcon
                :name="steps[currentStep].icon"
                :class="[steps[currentStep].color, 'size-10']"
              />
            </div>
          </div>

          <!-- Titre + description -->
          <div class="text-center space-y-2">
            <h2 class="text-xl font-bold text-highlighted">{{ steps[currentStep].title }}</h2>
            <p class="text-sm text-dimmed leading-relaxed">{{ steps[currentStep].description }}</p>
          </div>

          <!-- Détails (bullets) -->
          <ul v-if="steps[currentStep].detail" class="space-y-3 mt-4">
            <li
              v-for="(item, i) in steps[currentStep].detail.items"
              :key="i"
              class="flex items-start gap-3 bg-elevated/50 rounded-xl px-4 py-3"
            >
              <UIcon :name="item.icon" class="size-5 text-primary mt-0.5 shrink-0" />
              <span class="text-sm text-default">{{ item.text }}</span>
            </li>
          </ul>
        </div>
      </Transition>

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-8 gap-3">
        <UButton
          v-if="currentStep > 0"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          label="Précédent"
          @click="prev"
        />
        <div v-else class="flex-1" />

        <div class="flex gap-1.5">
          <button
            v-for="(_, i) in steps"
            :key="i"
            class="rounded-full transition-all duration-300"
            :class="i === currentStep ? 'bg-primary w-5 h-2' : 'bg-elevated w-2 h-2'"
            @click="currentStep = i"
          />
        </div>

        <UButton
          v-if="!isLast"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          label="Suivant"
          @click="next"
        />
        <UButton
          v-else
          color="primary"
          icon="i-lucide-check"
          label="Commencer !"
          @click="finish"
        />
      </div>
    </UCard>

    <!-- Skip -->
    <button
      class="text-xs text-dimmed hover:text-default transition-colors"
      @click="finish"
    >
      Passer l'introduction →
    </button>
  </div>
</template>


