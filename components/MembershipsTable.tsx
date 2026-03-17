"use client";

import { format, isWithinInterval } from "date-fns";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserMembership } from "@/prisma/generated/client";
import { Badge } from "./ui/badge";

export default function MembershipsTable({
  memberships,
  title,
}: {
  memberships: UserMembership[];
  title?: string | null;
}) {
  const filteredMemberships = memberships.filter(
    (m) => m.description !== "Flycard Vivere il Grappa 2025",
  );
  const t = useTranslations("MembershipsTable");
  return (
    <Card className="mt-4 xl:col-span-2">
      <CardHeader className="flex flex-row items-center">
        <div className="grid">
          {title !== null && (
            <CardTitle>{title || t("your_memberships")}</CardTitle>
          )}
          {/* <CardDescription className="text-balance">
            Le tue ultime iscrizioni al club.
          </CardDescription> */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("registered_at")}</TableHead>
              <TableHead className="text-right">{t("valid_until")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMemberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="font-medium">{membership.description}</div>
                </TableCell>
                <TableCell>
                  <Badge className="text-xs" variant="outline">
                    {isWithinInterval(new Date(), {
                      start: membership.validFrom!,
                      end: membership.validUntil!,
                    })
                      ? t("valid")
                      : t("expired")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(membership.createdAt, "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm text-muted-foreground">
                    <strong>{t("from")}:</strong>{" "}
                    {!!membership.validFrom &&
                      format(membership.validFrom, "dd/MM/yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>{t("to")}:</strong>{" "}
                    {!!membership.validUntil &&
                      format(membership.validUntil, "dd/MM/yyyy")}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
