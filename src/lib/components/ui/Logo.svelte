<script lang="ts">
	type Props = {
		/** Дополнительные классы для обёртки. */
		class?: string;
		/** Включить CRT-фликер (по умолчанию да; уважает prefers-reduced-motion). */
		animated?: boolean;
	};

	let { class: className = '', animated = true }: Props = $props();
</script>

<div
	class="logo {className}"
	class:logo--animated={animated}
	role="img"
	aria-label="ZombieLand survivor"
>
	<pre class="logo__art" aria-hidden="true">#####  ###  #   # ####  ##### ##### #      ###  #   # ####
   ## #   # ## ## #   #   #   #     #     #   # ##  # #   #
  ##  #   # # # # ####    #   ####  #     ##### # # # #   #
##    #   # #   # #   #   #   #     #     #   # #  ## #   #
#####  ###  #   # ####  ##### ##### ##### #   # #   # ####</pre>
	<div class="logo__word" aria-hidden="true">— survivor —</div>
</div>

<style>
	.logo {
		position: relative;
		display: inline-block;
		max-width: 100%;
		padding: 0.5rem 0;
		overflow: hidden;
	}

	.logo__art {
		margin: 0;
		font-family: var(--font-mono);
		/* масштабируется под ширину экрана, не переполняя контейнер */
		font-size: clamp(0.28rem, 1.5vw, 0.7rem);
		line-height: 1.05;
		font-weight: 700;
		white-space: pre;
		text-align: center;
		color: var(--color-amber);
		/* CRT: янтарное свечение + хроматический сдвиг (cyan/red) */
		text-shadow:
			0.6px 0 0 rgba(232, 67, 31, 0.5),
			-0.6px 0 0 rgba(52, 200, 192, 0.5),
			0 0 6px rgba(255, 138, 31, 0.7),
			0 0 14px rgba(255, 138, 31, 0.4);
	}

	.logo__word {
		margin-top: 0.6rem;
		text-align: center;
		font-family: var(--font-pixel);
		font-size: clamp(0.55rem, 2.2vw, 0.85rem);
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: var(--color-cyan);
		text-shadow: 0 0 8px rgba(52, 200, 192, 0.5);
	}

	/* скан-линии поверх логотипа */
	.logo::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0) 0,
			rgba(0, 0, 0, 0) 2px,
			rgba(0, 0, 0, 0.28) 3px,
			rgba(0, 0, 0, 0.28) 3px
		);
		mix-blend-mode: multiply;
	}

	.logo--animated .logo__art {
		animation: crt-flicker 3.6s infinite steps(60);
	}

	@keyframes crt-flicker {
		0%,
		100% {
			opacity: 1;
		}
		47% {
			opacity: 1;
		}
		48% {
			opacity: 0.86;
		}
		49% {
			opacity: 1;
		}
		73% {
			opacity: 0.92;
		}
		74% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.logo--animated .logo__art {
			animation: none;
		}
	}
</style>
