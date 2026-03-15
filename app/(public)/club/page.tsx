"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Timeline from "@/components/Timeline";
import { Button } from "@/components/ui/button";

export default function ClubPage() {
  return (
    <div className="mb-12">
      <div className="overflow-hidden">
        <div className="flex h-[50vh] flex-col bg-slate-50 bg-[url('/club.webp')] bg-cover bg-center">
          <div
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
            className="flex h-full flex-col items-center justify-center px-2"
          >
            {/* <h1 className="font-heading text-4xl uppercase text-white">IL CLUB</h1> */}
          </div>
        </div>
      </div>
      <section className="px-4 py-20">
        <div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
          <div>
            <h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
              <span className="block">L&apos;ASSOCIAZIONE</span>
              <span className="highlight block">VOLO LIBERO MONTEGRAPPA</span>
            </h1>

            <div className="py-10">
              <p className="mx-auto max-w-3xl text-left">
                L&apos;ASD Volo Libero Montegrappa nasce nel 1979 da un gruppo
                di amici e piloti, con l&apos;obiettivo di promuovere il volo
                libero nei dintorni di Borso Del Grappa, area che negli anni si
                è confermata come meta indiscussa di migliaia di piloti italiani
                e stranieri. <br />
                <br />
                Fin dagli anni &apos;70, con i primi deltaplani, e poi dalla
                fine degli anni &apos;80 con il parapendio, Borso del Grappa ha
                visto nascere molti piloti e li ha aiutati a crescere in questo
                sport grazie alle speciali caratteristiche aerologiche
                dell&apos;area, ai suoi ampi decolli facilmente raggiungibili,
                alla quasi totale assenza di vento forte. Caratteristiche
                perfette sia per i principianti, sia per i piloti più esperti
                che intendono affrontare voli di cross e competizioni.
              </p>

              <div className="mt-8 flex justify-center">
                <Link href="/directions">
                  <Button variant="outline">
                    LA NOSTRA SEDE
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <h1 className="mt-10 text-center font-heading text-2xl uppercase sm:text-3xl">
              <span className="mr-2">CONSIGLIO</span>
              <span className="highlight">DIRETTIVO</span>
            </h1>

            <div className="py-10">
              <div className="mx-auto max-w-3xl">
                <ul className="mx-auto text-left">
                  <li className="mb-2">Lorenzo Zamprogno (Presidente)</li>
                  <li className="mb-2">Deivi Gavril (Vice Presidente)</li>
                  <li className="mb-2">Nadia Moretto (Segreteria)</li>
                  <li className="mb-2">
                    Nicola Antico (Consigliere — Coordinatore Giovani e XC
                    locali)
                  </li>
                  <li className="mb-2">
                    Alessandro Cerato (Consigliere — Coordinatore Triveneto/XC)
                  </li>
                  <li className="mb-2">
                    Daniele Matteazzi (Consigliere — Coordinatore Delta)
                  </li>
                  <li className="mb-2">
                    Gianluca Donato (Consigliere — Gestione informatica &
                    Coordinatore eventi)
                  </li>
                </ul>
              </div>
            </div>

            <h1 className="mt-20 text-center font-heading text-2xl uppercase sm:text-3xl">
              <span className="mr-2">LA NOSTRA</span>
              <span className="highlight">STORIA</span>
            </h1>
            <div className="py-10">
              <p className="mx-auto max-w-6xl text-left">
                La storia dell&apos;associazione Volo Libero Monte Grappa inizia
                negli anni settanta, quando si volava dove e come si poteva, da
                autodidatti… compravi un delta e partivi! Anni di
                sperimentazione, incoscienza, anni pionieristici in cui i voli,
                seppur brevi, erano certamente densi di emozioni: “Decollo
                Barricata. 4 minuti di volo. Ottimo veleggiamento” sta scritto
                nel primo libretto di voli di uno dei soci fondatori! Poi
                arrivarono i primi parapendio, negli anni ottanta, e il club
                cresce in modo esponenziale: aumentano i piloti, nascono le
                scuole e le strutture che ancora oggi utilizziamo e, nel 1982 il
                primo Meeting Internazionale di Volo Libero (poi diventato
                Trofeo Montegrappa). <br />
                Dagli anni 90 ad oggi il passo è breve, ma costellato di eventi,
                nuovi piloti, nuovi gruppi che continuano, 40 anni dopo, a
                coltivare e promuovere la stessa passione per il volo che aveva
                ispirato i fondatori!
              </p>
              <div>
                <Timeline />
              </div>
            </div>

            <div className="mt-10 pb-20">
              <h1 className="text-center font-heading text-2xl uppercase">
                To Be Continued...
              </h1>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
