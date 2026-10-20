<template>
  <header class="border-b border-white/[0.07] bg-[#242044] text-[#fbf9ff]">
    <div class="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:min-h-[84px] sm:px-8 lg:px-12">
      <RouterLink to="/" class="flex shrink-0 items-center gap-3 no-underline transition-opacity hover:opacity-80" aria-label="Beranda SIKRABTEK 63">
        <img src="/images/logo.jpg" alt="Logo SIKRABTEK" class="h-9 w-9 rounded-full object-contain sm:h-10 sm:w-10" />
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-extrabold tracking-[-0.04em] sm:text-base">SIKRABTEK</strong>
          <span class="text-[11px] text-[#b8b5c5]">Angkatan 63</span>
        </div>
      </RouterLink>
      <a href="https://titiknol.site" target="_blank" rel="noopener noreferrer" aria-label="Kunjungi website TITIK NOL" class="flex shrink-0 items-center gap-2.5 no-underline transition-opacity hover:opacity-75">
        <span class="hidden text-xs text-[#85859f] sm:block">Built by</span>
        <img src="/images/titiknol.png" alt="Logo TITIK NOL" class="h-8 w-8 object-contain sm:h-9 sm:w-9" />
        <strong class="text-sm font-bold tracking-[-0.04em] sm:text-base">TitikNol<span class="text-[#c5b8d6]">.</span></strong>
      </a>
    </div>
  </header>
</template>
