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
    follow: 'M12 3l7 18-7-4-7 4 7-18Z'
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
