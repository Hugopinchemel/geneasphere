<template>
  <div class="min-h-dvh w-full flex flex-col">
    <!-- Hero -->
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <!-- Logo / Icône -->
      <div class="mb-6 flex items-center justify-center size-20 rounded-2xl bg-primary/10 border border-primary/20">
        <UIcon class="size-10 text-primary" name="i-lucide-git-fork" />
      </div>

      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-highlighted mb-4">
        Genea<span class="text-primary">Sphere</span>
      </h1>
      <p class="text-lg text-dimmed max-w-xl mb-10">
        Construisez, visualisez et partagez votre arbre généalogique.
        <br>
        Reliez les personnes, les unions et les générations en quelques clics.
      </p>

      <!-- CTA -->
      <div class="flex flex-col sm:flex-row items-center gap-3 mb-16">
        <UButton
          icon="i-lucide-log-in"
          label="Se connecter"
          size="lg"
          to="/login"
        />
        <UButton
          color="neutral"
          icon="i-lucide-user-plus"
          label="Créer un compte"
          size="lg"
          to="/register"
          variant="outline"
        />
      </div>

      <!-- Fonctionnalités -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
        <div class="rounded-xl border border-default bg-elevated p-5 flex flex-col gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UIcon class="size-5 text-primary" name="i-lucide-users" />
          </div>
          <h3 class="font-semibold text-highlighted">
            Gérez vos personnes
          </h3>
          <p class="text-sm text-dimmed">
            Ajoutez des individus avec leurs informations, photos et dates de vie.
          </p>
        </div>

        <div class="rounded-xl border border-default bg-elevated p-5 flex flex-col gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UIcon class="size-5 text-primary" name="i-lucide-heart" />
          </div>
          <h3 class="font-semibold text-highlighted">
            Nœuds matrimoniaux
          </h3>
          <p class="text-sm text-dimmed">
            Reliez les unions (mariage, PACS, union libre) et leurs enfants.
          </p>
        </div>

        <div class="rounded-xl border border-default bg-elevated p-5 flex flex-col gap-3">
          <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UIcon class="size-5 text-primary" name="i-lucide-git-fork" />
          </div>
          <h3 class="font-semibold text-highlighted">
            Arbre interactif
          </h3>
          <p class="text-sm text-dimmed">
            Visualisez l'arbre généalogique généré automatiquement depuis vos données.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-6 text-center text-xs text-dimmed border-t border-default">
      © {{ new Date().getFullYear() }} GeneaSphere — Votre mémoire familiale, numérisée.
    </footer>
  </div>
</template>
