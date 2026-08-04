<script lang="ts">
	import { Html5Qrcode } from 'html5-qrcode';
	import { onDestroy, onMount } from 'svelte';

	const API_URL =
		'https://script.google.com/macros/s/AKfycbyyOkH0nKKdzmeD8NsbdT1lkA9AZDhlHVFZ_xyd4htu3CoeYwXyUiFr91tC20DUavpeEA/exec';

	let scanner: Html5Qrcode;
	let loading = false;

	let result = '';
	let success = false;

	async function startScanner() {
		scanner = new Html5Qrcode('reader');

		try {
			await scanner.start(
				{
					facingMode: {
						ideal: 'environment'
					}
				},
				{
					fps: 10,
					qrbox: {
						width: 260,
						height: 260
					}
				},
				onScanSuccess,
                (e) => {
                    console.error(e)
                }
			);
		} catch (e) {
			console.error(e);
			result = 'Tidak dapat membuka kamera.';
		}
	}

	async function onScanSuccess(decodedText: string) {
		if (loading) return;
		loading = true;
		await scanner.pause(true);
		result = 'Memproses...';

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					qrCode: decodedText
				})
			});

			const data = await response.json();
			success = data.success;

			if (data.success) {
				result = `
                    Nama      : ${data.name}
                    Community : ${data.community}
                    Kategori  : ${data.category}
                    Jersey    : ${data.jersey}
                    BIB       : ${data.bib}
                `;
			} else {
				result = data.message;
			}
		} catch (e) {
			console.error(e);
			success = false;
			result = 'Terjadi kesalahan.';
		}

		setTimeout(async () => {
			loading = false;
			result = '';

			await scanner.resume();
		}, 2500);
	}

	onMount(startScanner);

	onDestroy(async () => {
		if (scanner?.isScanning) {
			await scanner.stop();
		}
	});
</script>

<div class="mx-auto flex min-h-screen max-w-lg flex-col bg-gray-100 p-4">
	<h1 class="mb-5 text-center text-3xl font-bold">
		Racepack Scanner
    </h1>
	<div class="overflow-hidden rounded-xl bg-white shadow">
		<div id="reader"></div>
	</div>
	<div class="mt-5 rounded-xl bg-white p-5 shadow">
		{#if loading}
			<div class="text-center">
				<div class="text-lg font-semibold">
					Memproses...
				</div>
			</div>
		{:else if result}
			{#if success}
				<div class="whitespace-pre-line text-green-700">
					{result}
				</div>
			{:else}
				<div class="whitespace-pre-line text-red-600">
					{result}
				</div>
			{/if}
		{:else}
			<div class="text-center text-gray-500">
				Arahkan QR Code ke kamera
			</div>
		{/if}
	</div>
</div>