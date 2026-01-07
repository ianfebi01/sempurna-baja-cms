<template>
  <section ref="containerRef" class="relative md:h-[calc(100vh-64px)] overflow-hidden">
    <div class="h-full main-container flex flex-col md:flex-row md:items-center gap-8 py-16 md:py-20">
      <div ref="textRef" class="flex flex-col max-w-2xl opacity-0 translate-y-8">
        <div class="flex flex-col justify-center grow">
          <h1 class="mt-0 text-2xl md:text-5xl mb-4">{{ banner?.title || 'Solusi Baja Ringan & Galvalum untuk Segala Proyek' }}</h1>
          <h2 ref="headingRef" class="text-xl md:text-2xl font-normal"></h2>
          <div class="flex items-center gap-6 md:gap-8 mt-8 md:mt-16 flex-wrap">
            <NuxtLink
              v-if="banner?.ctaText || banner?.ctaLink"
              :to="banner?.ctaLink || 'https://wa.me/6283144512987'"
              class="button button-primary">
              <Icon :name="banner?.ctaIcon || 'fa7-solid:paper-plane'" />
              {{ banner?.ctaText || 'Chat WhatsApp' }}
            </NuxtLink>
            <NuxtLink
              v-if="banner?.secondaryCtaText || banner?.secondaryCtaLink"
              :to="banner?.secondaryCtaLink || '/#katalog'"
              class="button button-secondary">
              <Icon :name="banner?.secondaryCtaIcon || 'fa7-solid:images'" />
              {{ banner?.secondaryCtaText || 'Lihat Katalog' }}
            </NuxtLink>
          </div>
        </div>
      </div>
      <div ref="imageRef" class="overflow-hidden aspect-square rounded-2xl relative opacity-0 translate-y-8">
        <img
          :src="banner?.image || '/images/sempurna-baja-5.webp'"
          :alt="banner?.imageTitle || 'sempurna baja 5'"
          width="500"
          height="500"
          loading="eager"
          class="object-cover w-full h-full hover:scale-105 ease-out duration-300" />

        <div class="absolute bottom-0 z-10 text-white/90 w-full inset-x-0">
          <!-- overlay shadow bottom -->
          <div class="absolute w-full bottom-0 bg-gradient-to-t from-[#000]/80 to-transparent h-full z-0">
          </div>
          <div class="p-4 lg:p-8 relative z-[1] mt-4">
            <p class="h2 m-0">{{ banner?.imageTitle || 'Sempurna Baja' }}</p>
            <p class="m-0">{{ banner?.imageSubtitle || 'Galvalum 0.30' }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MainHeroBanner } from "~~/shared/types/page"

defineProps<{
  banner?: MainHeroBanner
}>()
const containerRef = ref<HTMLElement | null>( null )
const imageRef = ref<( HTMLElement | null )>( null )
const textRef = ref<( HTMLElement | null )>( null )
const headingRef = ref<HTMLElement | null>( null )
let ctx: gsap.Context | null = null

onMounted( async () => {
    if ( !import.meta.client ) return

    // Lazy import GSAP & plugins only in browser
    const gsap = ( await import( "gsap" ) ).default
    const { ScrollTrigger } = await import( "gsap/ScrollTrigger" )
    const { TextPlugin } = await import( "gsap/TextPlugin" )

    gsap.registerPlugin( ScrollTrigger, TextPlugin )

    if ( !containerRef.value ) return
    ctx = gsap.context( () => {
        const tl = gsap.timeline( {
            scrollTrigger: {
                trigger       : containerRef.value,
                start         : "top 100%",
                toggleActions : "play none none none",
            },
        } )

        if ( textRef.value ) {
            tl.to( textRef.value, {
                ease       : "power2.out",
                translateY : 0,
                duration   : 1,
                opacity    : 1,
                delay      : 0.2,
            } )
        }

        if ( imageRef.value ) {
            tl.to( imageRef.value, {
                ease       : "power2.out",
                translateY : 0,
                duration   : 1,
                opacity    : 1,
                delay      : 0.4,
            }, "<" )
        }

        if ( headingRef.value ) {
            tl.to( headingRef.value, {
                duration : 2,
                text     : "Material lengkap (galvalum, channal, reng, plafon, genteng pasir) + jasa pemasangan profesional. Survey & estimasi kebutuhan tanpa biaya.",
                ease     : "none",
            } )
        }


    }, ( containerRef.value as HTMLElement ) )


} )

onBeforeUnmount( () => {
    if ( ctx ) ctx.revert()
} )
</script>