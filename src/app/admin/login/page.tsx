import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import styles from "../admin.module.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/admin");
  const sp = await searchParams;
  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <h1>Administración</h1>
        <p>Acceso del equipo de Praetoria.</p>
        <LoginForm next={sp.next ?? "/admin"} />
      </div>
    </div>
  );
}
