import React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useFormField } from "@/components/ui/form";

interface FormMessageI18NProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  name?: string;
}

export const FormMessageI18N = React.forwardRef<
  HTMLParagraphElement,
  FormMessageI18NProps
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const t = useTranslations("FormMessageI18N");
  const { name } = props;
  const tMessage = error
    ? name
      ? t.has(`${name}.${error.type}`)
        ? `${name}.${error.type}`
        : error.type
      : error.type
    : null;
  let body = error ? String(error?.message) : children;
  if (tMessage) {
    body = t.has(tMessage) ? t(tMessage) : body;
  }

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessageI18N.displayName = "FormMessageI18N";
