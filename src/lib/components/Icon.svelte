<script lang="ts" module>
  const PATHS = {
    search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm4.8 11.3L20 20',
    info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 7v7m0-10.2v.2',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12.5l4.5 4.5L19 7',
    minus: 'M5 12h14',
    locate: 'M12 4v3m0 10v3M4 12h3m10 0h3M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    close: 'M6 6l12 12M18 6 6 18',
    back: 'M15 5l-7 7 7 7',
    follow: 'M12 3l7 18-7-4-7 4 7-18Z',
    sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4',
    moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z',
    map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
    tube: 'M3 12h6m6 0h6M5.6 18.4l4.3-4.3m4.2-4.2 4.3-4.3M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    github:
      'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5.1 5.1 0 0 0 19.9 1S18.7.7 16 2.5a13.4 13.4 0 0 0-7 0C6.3.7 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22'
  };

  export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
  let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={PATHS[name]} />
</svg>
