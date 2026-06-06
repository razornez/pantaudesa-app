import { redirect } from "next/navigation";

// /suara is a legacy alias — redirect to the canonical /suara-warga route.
export default function SuaraPage() {
  redirect("/suara-warga");
}
