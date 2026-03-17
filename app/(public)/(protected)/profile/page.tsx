import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import getUserDetails from "@/actions/getUserDetails";
import ProfileView from "@/components/ProfileView";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: `Profilo - ${siteConfig.name}`,
  description: "Pagina profilo",
});

export default async function ProfilePage() {
  const t = await getTranslations("ProfilePage");
  const user = await getUserDetails();
  if (!user) return null;

  return (
    <div>
      <div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/colli-euganei.jpg')] bg-cover bg-left">
        <div
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          className="flex h-full flex-col items-center justify-center"
        >
          <h1 className="font-heading text-3xl  text-white">
            {user.firstName} {user.lastName}
          </h1>
          <h3 className="text-lg text-white">
            {t("member_from")} {format(user.createdAt, "dd/MM/yyyy")}
          </h3>
        </div>
      </div>
      <div className="container mx-auto my-10 max-w-6xl">
        <ProfileView user={user} />
      </div>
    </div>
  );
}
