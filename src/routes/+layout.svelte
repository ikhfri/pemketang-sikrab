<script lang="ts">
  import './layout.css';

  import { page } from '$app/state';
  import Header from '#lib/components/Header.svelte';
  import Footer from '#lib/components/Footer.svelte';

  let { children } = $props();

  const isAdmin = $derived(
    page.url.pathname.startsWith('/admin')
  );
</script>

<svelte:head>
  <link rel="icon" href="/images/logo.jpg" />
  <meta name="theme-color" content="#11152e" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  class="flex min-h-screen min-h-[100svh] flex-col bg-[#11152e] font-['DM_Sans'] text-[#f7f5fa] antialiased"
>
  {#if !isAdmin}
    <Header />
  {/if}

  <main class="flex w-full flex-1 flex-col">
    {@render children()}
  </main>

  {#if !isAdmin}
    <Footer />
  {/if}
</div>
