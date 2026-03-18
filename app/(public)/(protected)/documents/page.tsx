import { BookOpenText, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import ClubNotesList from "@/components/ClubNotesList";
import PrimaryButton from "@/components/PrimaryButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: `Documenti - ${siteConfig.name}`,
  description: "Documenti dell'associazione",
});

const verbali = [
  {
    id: 1,
    title: "Verbale Assemblea",
    link: "https://drive.google.com/file/d/1KFiqZuPd7YN6kfQvS_wVgf4wQyUkVnR0/view?usp=drive_link",
    createdAt: new Date("2024-06-16"),
  },
];

export default async function DocumentsPage() {
  const t = await getTranslations("DocumentsPage");
  return (
    <div className="font-mono">
      <div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/tappeti_takeoff.jpg')] bg-cover bg-top">
        <div
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          className="flex h-full flex-col items-center justify-center"
        >
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <h3 className="text-md mt-2 text-center text-white">
            {t("description")}
          </h3>
        </div>
      </div>
      <div className="container mx-auto mt-8">
        <Card className="mt-4 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <BookOpenText className="size-9" />
              <h1 className="mt-3 text-2xl">{t("statuto")}</h1>
            </div>
          </CardHeader>
          <CardContent className="mb-2 flex items-center justify-center">
            <a
              href="https://drive.google.com/file/d/1vR6tAY7D8wylXil-hjEOrwzhY3VmYX7w/view?usp=drive_link"
              target="_blank"
              rel="noopener"
            >
              <PrimaryButton>
                <Download className="mr-2 size-4" />
                {t("download")}
              </PrimaryButton>
            </a>
          </CardContent>
        </Card>
      </div>
      <div className="container mx-auto mt-8 mb-20">
        <ClubNotesList notes={verbali} />
      </div>
    </div>
  );
}
