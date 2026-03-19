import getSoci from "@/actions/getSoci";
import { NEXT_YEAR } from "@/constants";

import { getCurrentUser } from "@/lib/session";
import SociList from "@/components/SociList";

export default async function SociPage() {
  const user = await getCurrentUser();
  const soci = await getSoci(NEXT_YEAR);
  return (
    <div className="mb-12">
      <div className="overflow-hidden">
        <div className="flex h-[30vh] flex-col bg-slate-50">
          <div
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
            className="flex h-full items-center justify-center px-2"
          >
            <div className="aspect-[3/2] h-full w-auto bg-[url('/foto_di_gruppo_3.webp')] bg-cover bg-center bg-no-repeat" />
            <div className="aspect-[3/2] h-full w-auto bg-[url('/foto_di_gruppo_2.webp')] bg-cover bg-center bg-no-repeat" />
            <div className="aspect-[3/2] h-full w-auto bg-[url('/foto_di_gruppo_1.webp')] bg-cover bg-center bg-no-repeat" />
            <div className="aspect-[3/2] h-full w-auto bg-[url('/foto_di_gruppo_4.webp')] bg-cover bg-center bg-no-repeat" />
            <div className="aspect-[3/2] h-full w-auto bg-[url('/foto_di_gruppo_2.webp')] bg-cover bg-center bg-no-repeat" />
          </div>
        </div>
      </div>
      <section className="px-4 py-20">
        <div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
          <div>
            <h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
              <span className="block">LISTA SOCI</span>
              <span className="highlight block">VOLO LIBERO MONTEGRAPPA</span>
              <span className="block">{NEXT_YEAR}</span>
            </h1>

            <div className="py-10">
              {user ? (
                <div className="mt-4 flex flex-col gap-5">
                  <SociList data={soci} user={user} />
                </div>
              ) : (
                <p>Per accedere a questa sezione, effettua il login.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
