<script lang="ts">
    import type { TicketData } from "$lib/assets/schema";
    import { formatDateTime, validateBib } from "$lib/utils";
    import { Html5Qrcode } from "html5-qrcode";
    import { onDestroy, onMount, tick } from "svelte";

    const QR_API_URL =
        "https://script.google.com/macros/s/AKfycbyVMjVIR6fVgeSP1-mAN3w4seHtDdr5Qhsdlzac-HXp/dev";
    const BIB_API_URL =
        "https://script.google.com/macros/s/AKfycbwYRGhzHXXH8gEvtLVgCTMEtlBtYmaCeYoYS2pIRrQ/dev";
    const START_BIB = 0;
    const END_BIB = 2500

    let scanner: Html5Qrcode;
    let message = $state("");
    let loading = $state(false);
    let scanned = $state(false);
    let bibInput = $state(false);
    let qrCodeValue = $state("");
    let bib: number | undefined = $state(undefined);

    let racepackData: TicketData | null = $state(null);

    async function startScanner() {
        scanner = new Html5Qrcode("reader");

        try {
            await scanner.start(
                {
                    facingMode: "environment",
                },
                {
                    fps: 10,
                    qrbox: {
                        width: 260,
                        height: 260,
                    },
                },
                onScanSuccess,
                (e) => {
                    console.error(e);
                },
            );
        } catch (e) {
            console.error(e);
            message = "Camera not found.";
        }
    }

    async function onScanSuccess(decodedText: string) {
        if (loading) return;

        qrCodeValue = decodedText;
        
        loading = true;

        await scanner.stop();
        scanned = true;

        message = "Proccessing...";

        try {
            const url = `${QR_API_URL}?qrCode=${encodeURIComponent(decodedText)}`;

            const response = await fetch(url);
            const text = await response.text();
            const data = JSON.parse(text);

            if (data.success && data.exist) {
                racepackData = {
                    name: data.name,
                    community: data.community,
                    category: data.category,
                    jersey: data.jersey,
                    bib: data.bib,
                };
                
                bibInput = true;
                message = "";
            } else if (!data.success && data.exist) {
                racepackData = {
                    name: data.name,
                    community: data.community,
                    category: data.category,
                    jersey: data.jersey,
                    bib: data.bib,
                };

                if (data.bib) {
                    message = `Racepack has been collected at ${formatDateTime(data.timestamp)}.`;
                } else {
                    bibInput = true;
                    message = "";
                }
            } else {
                message = `Data not found.`;
            }
        } catch (e) {
            console.error(e);
            message = "Something went wrong.";
            alert(String(e));
        }

        loading = false;
    }

    async function uploadBIB() {
        if (!bib) {
            alert("Please fill the BIB Number");
            return;
        };
        
        if (!validateBib(bib.toString(), START_BIB, END_BIB)) {
            alert(`BIB Number must between ${START_BIB} - ${END_BIB}`);
            return ;
        }

        loading = true;
        message = "Proccessing...";

         try {
            const url = `${BIB_API_URL}?bib=${bib}&qrCode=${encodeURIComponent(qrCodeValue)}`;

            const response = await fetch(url);
            const text = await response.text();
            const data = JSON.parse(text);

            if (data.success && data.exist) {
                racepackData = {
                    name: data.name,
                    community: data.community,
                    category: data.category,
                    jersey: data.jersey,
                    bib: data.bib,
                };
                message = "";
            }
        } catch (e) {
            console.error(e);
            message = "Something went wrong.";
            alert(String(e));
        }

        bibInput = false;
        bib = undefined;
        loading = false;
    }

    async function scanAgain() {
        message = "";
        racepackData = null;
        loading = false;
        scanned = false;
        bibInput = false;

        await tick();
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
    <h1 class="mb-5 text-center text-lg font-bold">
        Buddhayana Run 2026 Medan
        <br />
        Racepack Collection QR Scanner
    </h1>

    {#if bibInput && !loading}
        <div class="relative flex items-center justify-center gap-4">
            <div class="text-gray-500">
                BIB
            </div>
            <input
                type="text"
                inputmode="numeric"
                placeholder="Fill BIB Number"
                bind:value={bib}
                maxlength="4"
                pattern="[0-9]{4}"
                class="text-gray w-full rounded-xl bg-white px-12 py-3 shadow"
                />
            <button
                    class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                    onclick={uploadBIB}
                >
                Upload BIB
            </button>
        </div>
    {/if}

    {#if !scanned}
        <div class="overflow-hidden rounded-xl bg-white shadow mt-4">
            <div id="reader"></div>
        </div>
    {/if}

    <div class="mt-5 rounded-xl bg-white p-5 shadow">
        {#if loading}
            <div class="text-center">
                <div class="text-lg font-semibold">Processing...</div>
            </div>
        {:else if racepackData}
            {#if message}
                <div class="text-red-600">
                    {message}
                </div>
            {/if}

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
                    <tr class="border-b">
                        <th class="py-2 font-semibold">Jersey</th>
                        <td class="py-2">{racepackData.jersey}</td>
                    </tr>
                    <tr>
                        <th class="py-2 font-semibold">BIB</th>
                        <td class="py-2">{racepackData.bib}</td>
                    </tr>
                </tbody>
            </table>

            <button
                class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                onclick={scanAgain}
            >
                Scan Again
            </button>
        {:else if !racepackData && message}
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
