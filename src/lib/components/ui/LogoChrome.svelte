<script lang="ts">
	type Props = {
		/** Дополнительные классы для обёртки. */
		class?: string;
	};

	let { class: className = '' }: Props = $props();
</script>

<div class="logo-chrome {className}" role="img" aria-label="ZombieLand survivor">
	<pre class="logo-chrome__art logo-chrome__art--shadow" aria-hidden="true"> 
_____    ___    __  __   ____    ___   _____   _          _      _   _   ____   
|__  /  / _ \  |  \/  | | __ )  |_ _| | ____| | |        / \    | \ | | |  _ \  
  / /  | | | | | |\/| | |  _ \   | |  |  _|   | |       / _ \   |  \| | | | | | 
 / /_  | |_| | | |  | | | |_) |  | |  | |___  | |___   / ___ \  | |\  | | |_| | 
/____|  \___/  |_|  |_| |____/  |___| |_____| |_____| /_/   \_\ |_| \_| |____/  </pre>
	<pre class="logo-chrome__art logo-chrome__art--face" aria-hidden="true">
_____    ___    __  __   ____    ___   _____   _          _      _   _   ____   
|__  /  / _ \  |  \/  | | __ )  |_ _| | ____| | |        / \    | \ | | |  _ \  
  / /  | | | | | |\/| | |  _ \   | |  |  _|   | |       / _ \   |  \| | | | | | 
 / /_  | |_| | | |  | | | |_) |  | |  | |___  | |___   / ___ \  | |\  | | |_| | 
/____|  \___/  |_|  |_| |____/  |___| |_____| |_____| /_/   \_\ |_| \_| |____/  </pre>
	<div class="logo-chrome__word" aria-hidden="true">— survivor —</div>
</div>

<style>
	.logo-chrome {
		position: relative;
		display: inline-block;
		max-width: 100%;
		padding: 0.5rem 0;
		overflow: hidden;
		text-align: center;
	}

	.logo-chrome__art {
		margin: 0;
		font-family: var(--font-mono);
		font-size: clamp(0.32rem, 1.7vw, 0.82rem);
		line-height: 1.05;
		font-weight: 700;
		white-space: pre;
		text-align: center;
	}

	/* передний слой — хром-градиент, обрезанный по тексту */
	.logo-chrome__art--face {
		position: relative;
		z-index: 1;
		background: linear-gradient(
			180deg,
			#eafdff 0%,
			#a3ecf7 32%,
			#2ab0cf 52%,
			#79dbe6 66%,
			#1b85a0 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
	}

	/* задний слой — тёмная копия со смещением: 3D-выдавливание */
	.logo-chrome__art--shadow {
		position: absolute;
		inset: 0;
		z-index: 0;
		color: #0e3a49;
		transform: translate(0.05em, 0.06em);
		text-shadow: 0.05em 0.06em 0 #0a2c38;
	}

	.logo-chrome__word {
		margin-top: 0.6rem;
		text-align: center;
		font-family: var(--font-pixel);
		font-size: clamp(0.55rem, 2.2vw, 0.85rem);
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: var(--color-amber);
		text-shadow: 0 0 8px rgba(255, 138, 31, 0.45);
	}
</style>
