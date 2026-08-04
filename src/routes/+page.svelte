<script lang="ts">
    import type { TicketData } from '$lib/assets/schema';
    import { Html5Qrcode } from 'html5-qrcode';
    import { onDestroy, onMount } from 'svelte';

	const API_URL =
		'https://script.google.com/macros/s/AKfycbx8tqS4K17vtfr3yuAbqCH1JRPwsrhUK0SGyx_eD6Qv9IdirPLld9ht7lSD9RVauBzKyA/exec';

	let scanner: Html5Qrcode;
	let message = $state('');
	let loading = $state(false);
	let scanned = $state(false);

	let racepackData: TicketData | null = $state(null)


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
			message = 'Camera not found.';
		}
	}

	async function onScanSuccess(decodedText: string) {
		if (loading) return;

		loading = true;

		await scanner.stop();
		scanned = true;

		message = 'Proccessing...';

		try {
			const url = `${API_URL}?qrCode=${encodeURIComponent(decodedText)}`;

			const response = await fetch(url);
			const text = await response.text();
			const data = JSON.parse(text);

			if (data.success) {
				racepackData = {
					name: data.name,
					community: data.community,
					category: data.category,
					jersey: data.jersey
				}
				message = '';
			} else {
				racepackData = null;
				message = `Racepack has been collected at ${data.timestamp}`;
			}
		} catch (e) {
			console.error(e);
			message = 'Something went wrong.';
			alert(String(e));
		}

		loading = false;
	}

	async function scanAgain() {
		message = '';
		racepackData = null;
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
					Processing...
				</div>
			</div>
		{:else if racepackData}
			<table class="w-full border-collapse text-left">
				<tbody>
					<tr class="border-b">
						<th class="w-32 py-2 font-semibold">Name</th>
						<td class="py-2">{racepackData.name}</td>
					</tr>
					<tr class="border-b">
						<th class="py-2 font-semibold">Community</th>
						<td class="py-2">{racepackData.community}</td>
					</tr>
					<tr class="border-b">
						<th class="py-2 font-semibold">Category</th>
						<td class="py-2">{racepackData.category}</td>
					</tr>
					<tr>
						<th class="py-2 font-semibold">Jersey</th>
						<td class="py-2">{racepackData.jersey}</td>
					</tr>
				</tbody>
			</table>

			<button
				class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
				onclick={scanAgain}
			>
				Scan Again
			</button>

		{:else if message}
			<div class="text-red-600">
				{message}
			</div>
			<button
				class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
				onclick={scanAgain}
			>
				Scan Again
			</button>
		{:else}
			<div class="text-center text-gray-500">
				Point the camera at the QR Code
			</div>
		{/if}
	</div>
</div>