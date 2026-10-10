<svelte:head>
	<title>MagicInfo</title>
</svelte:head>

<div class="video-container">
	<iframe
		src="https://www.youtube.com/embed/FwyXU8QBXxg?si=NErZVDXWpwz5sisS&autoplay=1&mute=1"
		title="YouTube video player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		allowfullscreen
	></iframe>
</div>

<style>
	.video-container {
		padding: 20px;
	}

	iframe {
		width: 100%;
		height: calc(100vh - 40px);
		border: none;
		border-radius: 8px;
	}
</style>
