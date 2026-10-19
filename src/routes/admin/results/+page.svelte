<script lang="ts">

let { data } = $props();



    let countdown = $state(10);

    let showResults = $state(false);



    const PIE_RADIUS = 58;

    const PIE_CENTER = 70;



        const pieColors = [
        "#9564d9", // Noctis
        "#e83f69", // Valor
        "#3979d7", // Melankara
        "#ff7950", // Resolve
        "#986c79", // Bingbong
        "#f23a9e", // Rubora
        "#e2d4f2", // Tranquil
        "#44d78e", // Aversa
        "#f7bd43", // Euphoria
        "#40a7ef"  // Aspire
    ];



    $effect(() => {

        if (showResults) {

            return;

        }



        countdown = 10;



        const interval = setInterval(() => {

            countdown -= 1;



            if (countdown <= 0) {

                showResults = true;

                clearInterval(interval);

            }

        }, 1000);



        return () => clearInterval(interval);

    });



    function getPercentage(voteCount: number) {

        if (data.totalVotes === 0) {

            return 0;

        }



        return (voteCount / data.totalVotes) * 100;

    }



    function getRoundedPercentage(voteCount: number) {

        return Math.round(getPercentage(voteCount));

    }



    let sortedResults = $derived(

        [...data.results].sort(

            (a, b) => b.voteCount - a.voteCount

        )

    );



    let selectedCandidate = $derived(

        sortedResults.length > 0

            ? sortedResults[0]

            : null

    );



    function polarToCartesian(

        centerX: number,

        centerY: number,

        radius: number,

        angleInDegrees: number

    ) {

        const angleInRadians =

            ((angleInDegrees - 90) * Math.PI) / 180;



        return {

            x:

                centerX +

                radius * Math.cos(angleInRadians),



            y:

                centerY +

                radius * Math.sin(angleInRadians)

        };

    }



    function createPieSlice(

        startAngle: number,

        endAngle: number

    ) {

        const start = polarToCartesian(

            PIE_CENTER,

            PIE_CENTER,

            PIE_RADIUS,

            endAngle

        );



        const end = polarToCartesian(

            PIE_CENTER,

            PIE_CENTER,

            PIE_RADIUS,

            startAngle

        );



        const angle = endAngle - startAngle;



        const largeArcFlag = angle > 180 ? 1 : 0;



        return [

            `M ${PIE_CENTER} ${PIE_CENTER}`,

            `L ${start.x} ${start.y}`,

            `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,

            "Z"

        ].join(" ");

    }



    let pieSlices = $derived.by(() => {

        if (

            data.totalVotes === 0 ||

            sortedResults.length === 0

        ) {

            return [];

        }



        let currentAngle = 0;



        return sortedResults.map((candidate, index) => {

            const percentage =

                (candidate.voteCount / data.totalVotes) *

                100;



            const startAngle = currentAngle;



            const endAngle =

                currentAngle + percentage * 3.6;



            currentAngle = endAngle;



            return {

                candidate,

                index,

                percentage,

                path: createPieSlice(

                    startAngle,

                    endAngle

                ),

                color:

                    pieColors[

                        index % pieColors.length

                    ]

            };

        });

    });

</script>



<svelte:head>

    <title>Hasil Voting — Admin</title>



    <meta

        name="description"

        content="Hasil voting Ketua dan Wakil Angkatan."

    />

</svelte:head>



<div class="min-h-screen bg-[#242044] text-[#FFFFFF]">

    {#if !showResults}




        <main

            class="flex min-h-screen items-center justify-center bg-[#242044]"

        >

            <span

                class="text-[9rem] font-bold leading-none tracking-[-0.08em] text-[#FFFFFF] tabular-nums sm:text-[12rem]"

            >

                {countdown}

            </span>

        </main>

    {:else}




        <header

            class="border-b border-[#514b70] bg-[#242044]"

        >

            <div

                class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"

            >

                <div class="flex items-center gap-3">

                    <img

                        src="/images/logo.jpg"

                        alt="SIKRABTEK 63"

                        class="h-10 w-10 rounded-xl border border-[#514b70] object-cover"

                    />



                    <div>

                        <p

                            class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C6B9C]"

                        >

                            Admin Panel

                        </p>



                        <h1

                            class="mt-1 text-lg font-bold tracking-tight text-[#FFFFFF] sm:text-xl"

                        >

                            Hasil Voting

                        </h1>

                    </div>

                </div>



                <a

                    href="/admin"

                    class="inline-flex items-center gap-2 border border-[#514b70] bg-[#2d284b] px-4 py-2.5 text-sm font-semibold text-[#a39dbf] transition hover:border-[#5C6B9C] hover:bg-[#403a61] hover:text-[#FFFFFF]"

                >

                    <svg

                        xmlns="http://www.w3.org/2000/svg"

                        viewBox="0 0 24 24"

                        fill="none"

                        stroke="currentColor"

                        stroke-width="2"

                        class="h-4 w-4"

                    >

                        <path

                            stroke-linecap="round"

                            stroke-linejoin="round"

                            d="M19 12H5m7 7-7-7 7-7"

                        />

                    </svg>



                    Kembali

                </a>

            </div>

        </header>






        <main

            class="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14"

        >


            <div

                class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"

            >

                <div>

                    <div

                        class="inline-flex items-center gap-2 border border-[#44d78e]/20 bg-[#44d78e]/10 px-3 py-1.5"

                    >

                        <span

                            class="h-2 w-2 rounded-full bg-[#44d78e]"

                        ></span>



                        <span

                            class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#44d78e]"

                        >

                            Hasil tersedia

                        </span>

                    </div>



                    <h2

                        class="mt-5 text-3xl font-bold tracking-tight text-[#FFFFFF] sm:text-4xl"

                    >

                        Hasil Voting

                    </h2>



                    <p

                        class="mt-2 text-sm leading-6 text-[#a39dbf]"

                    >

                        Rekapitulasi seluruh suara yang masuk.

                    </p>

                </div>



                <div

                    class="border border-[#514b70] bg-[#2d284b] px-6 py-4"

                >

                    <p

                        class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c7c2df]"

                    >

                        Total Suara

                    </p>



                    <p

                        class="mt-1 text-3xl font-bold tabular-nums text-[#FFFFFF]"

                    >

                        {data.totalVotes}

                    </p>

                </div>

            </div>



            {#if sortedResults.length === 0}


                <div

                    class="mt-10 border border-dashed border-[#514b70] bg-[#2d284b] px-6 py-20 text-center"

                >

                    <div

                        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#242044] text-[#c7c2df]"

                    >

                        <svg

                            xmlns="http://www.w3.org/2000/svg"

                            viewBox="0 0 24 24"

                            fill="none"

                            stroke="currentColor"

                            stroke-width="1.8"

                            class="h-7 w-7"

                        >

                            <path

                                stroke-linecap="round"

                                stroke-linejoin="round"

                                d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8"

                            />

                        </svg>

                    </div>



                    <h3

                        class="mt-5 text-lg font-bold text-[#FFFFFF]"

                    >

                        Belum ada suara

                    </h3>



                    <p

                        class="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a39dbf]"

                    >

                        Belum ada pemilih yang memberikan suara.

                    </p>

                </div>

            {:else}


                {#if selectedCandidate}

                    <section

                        class="mt-10 border border-[#a78bfa]/30 bg-[#2d284b] p-6 text-center sm:p-8"

                    >

                        <p

                            class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a78bfa]"

                        >

                            Kandidat Terpilih

                        </p>



                        <div

                            class="mt-6 flex flex-col items-center"

                        >

                            <div class="flex -space-x-3">

                                <div

                                    class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#2d284b] bg-[#242044] ring-1 ring-[#a78bfa]/30"

                                >

                                    {#if selectedCandidate.ketuaPhotoUrl}

                                        <img

                                            src={selectedCandidate.ketuaPhotoUrl}

                                            alt={selectedCandidate.ketuaName}

                                            class="h-full w-full object-cover"

                                        />

                                    {:else}

                                        <div

                                            class="flex h-full w-full items-center justify-center text-[#c7c2df]"

                                        >

                                            <svg

                                                xmlns="http://www.w3.org/2000/svg"

                                                viewBox="0 0 24 24"

                                                fill="none"

                                                stroke="currentColor"

                                                stroke-width="1.5"

                                                class="h-8 w-8"

                                            >

                                                <circle

                                                    cx="9"

                                                    cy="8"

                                                    r="3"

                                                />



                                                <path

                                                    stroke-linecap="round"

                                                    d="M3 20a6 6 0 0 1 12 0"

                                                />

                                            </svg>

                                        </div>

                                    {/if}

                                </div>



                                <div

                                    class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-[#2d284b] bg-[#242044] ring-1 ring-[#a78bfa]/30"

                                >

                                    {#if selectedCandidate.wakilPhotoUrl}

                                        <img

                                            src={selectedCandidate.wakilPhotoUrl}

                                            alt={selectedCandidate.wakilName}

                                            class="h-full w-full object-cover"

                                        />

                                    {:else}

                                        <div

                                            class="flex h-full w-full items-center justify-center text-[#c7c2df]"

                                        >

                                            <svg

                                                xmlns="http://www.w3.org/2000/svg"

                                                viewBox="0 0 24 24"

                                                fill="none"

                                                stroke="currentColor"

                                                stroke-width="1.5"

                                                class="h-8 w-8"

                                            >

                                                <circle

                                                    cx="9"

                                                    cy="8"

                                                    r="3"

                                                />



                                                <path

                                                    stroke-linecap="round"

                                                    d="M3 20a6 6 0 0 1 12 0"

                                                />

                                            </svg>

                                        </div>

                                    {/if}

                                </div>

                            </div>



                            <h3

                                class="mt-6 text-2xl font-bold tracking-tight text-[#FFFFFF] sm:text-3xl"

                            >

                                {selectedCandidate.ketuaName}

                            </h3>



                            <div

                                class="my-2 text-sm text-[#c7c2df]"

                            >

                                &

                            </div>



                            <h4

                                class="text-xl font-semibold text-[#a78bfa] sm:text-2xl"

                            >

                                {selectedCandidate.wakilName}

                            </h4>



                            <div

                                class="mt-5 flex items-center gap-3"

                            >

                                <span

                                    class="border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1.5 text-xs font-bold text-[#a78bfa]"

                                >

                                    {selectedCandidate.voteCount}

                                    suara

                                </span>



                                <span

                                    class="border border-[#514b70] bg-[#242044] px-3 py-1.5 text-xs font-bold text-[#a39dbf]"

                                >

                                    {getRoundedPercentage(

                                        selectedCandidate.voteCount

                                    )}%

                                </span>

                            </div>

                        </div>

                    </section>

                {/if}


                <section

                    class="mt-6 border border-[#514b70] bg-[#2d284b] p-6 sm:p-10"

                >

                    <div class="text-center">

                        <p

                            class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c7c2df]"

                        >

                            Distribusi Suara

                        </p>



                        <h3

                            class="mt-2 text-xl font-semibold text-[#FFFFFF]"

                        >

                            Seluruh Pasangan Calon

                        </h3>

                    </div>



                    <div

                        class="mt-8 flex flex-col items-center"

                    >


                        <div

                            class="relative h-72 w-72 sm:h-80 sm:w-80"

                        >

                            <svg

                                class="h-full w-full"

                                viewBox="0 0 140 140"

                                fill="none"

                            >

                                <circle

                                    cx="70"

                                    cy="70"

                                    r="58"

                                    fill="#343052"

                                />



                                {#each pieSlices as slice (slice.candidate.id)}

                                    <path

                                        d={slice.path}

                                        fill={slice.color}

                                        stroke="#FFFFFF"

                                        stroke-width="1.5"

                                        class="transition-opacity duration-300 hover:opacity-80"

                                    />

                                {/each}

                            </svg>



                            <div

                                class="absolute inset-0 flex flex-col items-center justify-center"

                            >

                                <p

                                    class="text-4xl font-bold tabular-nums tracking-tight text-[#FFFFFF]"

                                >

                                    {data.totalVotes}

                                </p>



                                <p

                                    class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7c2df]"

                                >

                                    Total suara

                                </p>

                            </div>

                        </div>



         



                        <div

                            class="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"

                        >

                            {#each pieSlices as slice (slice.candidate.id)}

                                <div

                                    class={`border p-4 ${

                                        slice.index === 0

                                            ? "border-[#a78bfa]/30 bg-[#a78bfa]/5"

                                            : "border-[#514b70] bg-[#242044]"

                                    }`}

                                >

                                    <div

                                        class="flex items-start gap-3"

                                    >

                                        <div

                                            class="mt-1.5 h-3 w-3 shrink-0 rounded-sm"

                                            style={`background-color: ${slice.color}`}

                                        ></div>



                                        <div

                                            class="min-w-0 flex-1"

                                        >

                                            <div

                                                class="flex items-start justify-between gap-3"

                                            >

                                                <div>

                                                    <p

                                                        class="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c7c2df]"

                                                    >

                                                        Pasangan {String(

                                                            slice.index + 1

                                                        ).padStart(

                                                            2,

                                                            "0"

                                                        )}

                                                    </p>



                                                    <p

                                                        class="mt-1 text-sm font-semibold leading-5 text-[#FFFFFF]"

                                                    >

                                                        {slice.candidate.ketuaName}



                                                        <span

                                                            class="font-normal text-[#c7c2df]"

                                                        >

                                                            &

                                                        </span>



                                                        {slice.candidate.wakilName}

                                                    </p>

                                                </div>



                                                {#if slice.index === 0}

                                                    <span

                                                        class="shrink-0 border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#a78bfa]"

                                                    >

                                                        Terbanyak

                                                    </span>

                                                {/if}

                                            </div>



                                            <div

                                                class="mt-3 flex items-center justify-between"

                                            >

                                                <span

                                                    class="text-xs text-[#c7c2df]"

                                                >

                                                    {slice.candidate.voteCount}

                                                    suara

                                                </span>



                                                <span

                                                    class="text-sm font-bold tabular-nums"

                                                    style={`color: ${slice.color}`}

                                                >

                                                    {getRoundedPercentage(

                                                        slice.candidate.voteCount

                                                    )}%

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            {/each}

                        </div>

                    </div>

                </section>



        



                <section class="mt-8">

                    <div class="mb-4">

                        <p

                            class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c7c2df]"

                        >

                            Perolehan Suara

                        </p>



                        <h3

                            class="mt-1 text-lg font-semibold text-[#FFFFFF]"

                        >

                            Daftar Pasangan Calon

                        </h3>

                    </div>



                    <div class="space-y-3">

                        {#each sortedResults as candidate, index (candidate.id)}

                            {@const percentage = getRoundedPercentage(

                                candidate.voteCount

                            )}



                            <article

                                class={`border bg-[#2d284b] p-4 sm:p-5 ${

                                    index === 0

                                        ? "border-[#a78bfa]/40"

                                        : "border-[#514b70]"

                                }`}

                            >

                                <div

                                    class="flex flex-col gap-4 sm:flex-row sm:items-center"

                                >


                                    <div

                                        class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${

                                            index === 0

                                                ? "bg-[#a78bfa] text-[#242044]"

                                                : "bg-[#242044] text-[#c7c2df]"

                                        }`}

                                    >

                                        #{index + 1}

                                    </div>




                                    <div

                                        class="flex shrink-0 -space-x-2"

                                    >

                                        <div

                                            class="h-12 w-12 overflow-hidden rounded-xl border-2 border-[#FFFFFF] bg-[#242044]"

                                        >

                                            {#if candidate.ketuaPhotoUrl}

                                                <img

                                                    src={candidate.ketuaPhotoUrl}

                                                    alt={candidate.ketuaName}

                                                    class="h-full w-full object-cover"

                                                />

                                            {:else}

                                                <div

                                                    class="flex h-full w-full items-center justify-center text-[#c7c2df]"

                                                >

                                                    <svg

                                                        xmlns="http://www.w3.org/2000/svg"

                                                        viewBox="0 0 24 24"

                                                        fill="none"

                                                        stroke="currentColor"

                                                        stroke-width="1.5"

                                                        class="h-5 w-5"

                                                    >

                                                        <circle

                                                            cx="9"

                                                            cy="8"

                                                            r="3"

                                                        />



                                                        <path

                                                            stroke-linecap="round"

                                                            d="M3 20a6 6 0 0 1 12 0"

                                                        />

                                                    </svg>

                                                </div>

                                            {/if}

                                        </div>



                                        <div

                                            class="h-12 w-12 overflow-hidden rounded-xl border-2 border-[#FFFFFF] bg-[#242044]"

                                        >

                                            {#if candidate.wakilPhotoUrl}

                                                <img

                                                    src={candidate.wakilPhotoUrl}

                                                    alt={candidate.wakilName}

                                                    class="h-full w-full object-cover"

                                                />

                                            {:else}

                                                <div

                                                    class="flex h-full w-full items-center justify-center text-[#c7c2df]"

                                                >

                                                    <svg

                                                        xmlns="http://www.w3.org/2000/svg"

                                                        viewBox="0 0 24 24"

                                                        fill="none"

                                                        stroke="currentColor"

                                                        stroke-width="1.5"

                                                        class="h-5 w-5"

                                                    >

                                                        <circle

                                                            cx="9"

                                                            cy="8"

                                                            r="3"

                                                        />



                                                        <path

                                                            stroke-linecap="round"

                                                            d="M3 20a6 6 0 0 1 12 0"

                                                        />

                                                    </svg>

                                                </div>

                                            {/if}

                                        </div>

                                    </div>




                                    <div class="min-w-0 flex-1">

                                        <div

                                            class="flex flex-wrap items-center gap-2"

                                        >

                                            <p

                                                class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c7c2df]"

                                            >

                                                Pasangan {String(

                                                    index + 1

                                                ).padStart(2, "0")}

                                            </p>



                                            {#if index === 0}

                                                <span

                                                    class="border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#a78bfa]"

                                                >

                                                    Terbanyak

                                                </span>

                                            {/if}

                                        </div>



                                        <h4

                                            class="mt-1 truncate text-sm font-semibold text-[#FFFFFF] sm:text-base"

                                        >

                                            {candidate.ketuaName}



                                            <span

                                                class="font-normal text-[#c7c2df]"

                                            >

                                                &

                                            </span>



                                            {candidate.wakilName}

                                        </h4>

                                    </div>




                                    <div

                                        class="flex items-center gap-5 sm:justify-end"

                                    >

                                        <div

                                            class="text-left sm:text-right"

                                        >

                                            <p

                                                class="text-xl font-bold tabular-nums text-[#FFFFFF]"

                                            >

                                                {candidate.voteCount}

                                            </p>



                                            <p

                                                class="text-[9px] font-bold uppercase tracking-[0.15em] text-[#c7c2df]"

                                            >

                                                suara

                                            </p>

                                        </div>



                                        <div

                                            class="min-w-[50px] text-right"

                                        >

                                            <p

                                                class="text-lg font-bold tabular-nums"

                                                style={`color: ${

                                                    pieColors[

                                                        index %

                                                            pieColors.length

                                                    ]

                                                }`}

                                            >

                                                {percentage}%

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </article>

                        {/each}

                    </div>

                </section>




                <div

                    class="mt-8 border border-[#514b70] bg-[#2d284b] px-5 py-4 text-center"

                >

                    <p

                        class="text-xs leading-5 text-[#c7c2df]"

                    >

                        Hasil ini menampilkan jumlah suara yang

                        tercatat di dalam sistem.

                    </p>

                </div>

            {/if}

        </main>

    {/if}

</div>