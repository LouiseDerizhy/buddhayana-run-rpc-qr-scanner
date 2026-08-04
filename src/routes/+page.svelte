<script lang="ts">
	import { Html5Qrcode } from 'html5-qrcode';
	import { onDestroy, onMount } from 'svelte';

	const API_URL =
		'https://script.google.com/macros/s/AKfycbx8tqS4K17vtfr3yuAbqCH1JRPwsrhUK0SGyx_eD6Qv9IdirPLld9ht7lSD9RVauBzKyA/exec';

	let scanner: Html5Qrcode;
	let result = $state('');
	let loading = $state(false);
	let scanned = $state(false);
	let success = $state(false);


	async function startScanner() {
		scanner = new Html5Qrcode('reader');

		try {
			await scanner.start(
				{
					facingMode: 'environment'
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

		await scanner.stop();
		scanned = true;

		result = 'Memproses...';

		try {
			const url = `${API_URL}?qrCode=${encodeURIComponent(decodedText)}`;

			const response = await fetch(url);
			const text = await response.text();
			const data = JSON.parse(text);

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
				result = `
					${data.message} pada ${data.timestamp}
				`;
			}
		} catch (e) {
			console.error(e);
			success = false;
			result = 'Terjadi kesalahan.';
			alert(String(e));
		}

		loading = false;
	}

	async function scanAgain() {
		result = '';
		success = false;
		loading = false;
		scanned = false;

		await startScanner();
	}

	onMount(startScanner);

	onDestroy(async () => {
		if (scanner?.isScanning) {
			await scanner.stop();
		}
	});
</script>

<div class="mx-auto flex min-h-screen max-w-lg flex-col bg-gray-100 p-4">
	<h1 class="mb-5 text-center text-2xl font-bold">
		Buddhayana Run 2026 Medan
		<br />
		Racepack Collection
		<br />
		QR Scanner
	</h1>

	{#if !scanned}
		<div class="overflow-hidden rounded-xl bg-white shadow">
			<div id="reader"></div>
		</div>
	{/if}

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

			<button
				class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
				onclick={scanAgain}
			>
				Scan Lagi
			</button>
		{:else}
			<div class="text-center text-gray-500">
				Arahkan QR Code ke kamera
			</div>
		{/if}
	</div>
</div>