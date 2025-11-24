export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import type { ContactRequest } from "@prisma/client";
import ContactsTable from "./ContactsTable";

export const revalidate = 30;


export default async function AdminContactsPage() {
  const allRequests: ContactRequest[] = await db.contactRequest.findMany({
    orderBy: { requestDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-yellow-400">
          Contact Requests
        </h1>
        <p className="text-sm text-gray-400">
          These entries come from the Advertise page form. Use this list to
          follow up with potential sponsors.
        </p>
      </header>

      <ContactsTable allRequests={allRequests} />
    </div>
  );
}
