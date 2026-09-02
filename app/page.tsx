import { redirect } from "next/navigation";

/** La racine ne montre rien : elle envoie sur les contacts. */
export default function Racine() {
  redirect("/contacts");
}
