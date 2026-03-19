import type { AvatarProps } from "@radix-ui/react-avatar";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/prisma/generated/client";

interface UserAvatarProps extends AvatarProps {
  user?: Pick<User, "image" | "firstName">;
  icon?: LucideIcon;
}

export function UserAvatar({ user, icon: Icon, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      {user?.image ? (
        <AvatarImage
          alt="Picture"
          src={user.image}
          referrerPolicy="no-referrer"
        />
      ) : (
        <AvatarFallback>
          {Boolean(user) && <span className="sr-only">{user?.firstName}</span>}
          {Icon && <Icon className="size-4" />}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
