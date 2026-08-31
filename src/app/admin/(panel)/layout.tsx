import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { logoutAction } from "@/server/actions/admin";
import styles from "../admin.module.css";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/admin" className={styles.brand}>
          Praetoria · Administración
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin">Solicitudes</Link>
          <Link href="/admin/profesionales">Profesionales</Link>
          <Link href="/admin/candidaturas">Candidaturas</Link>
          <Link href="/admin/incidencias">Incidencias</Link>
          <Link href="/admin/opiniones">Opiniones</Link>
          <Link href="/admin/contenido">Contenido</Link>
          <Link href="/admin/zonas">Zonas</Link>
          <Link href="/admin/seo">SEO</Link>
          <span className={styles.who}>{session.name}</span>
          <form action={logoutAction}>
            <button type="submit" className={styles.logout}>
              Salir
            </button>
          </form>
        </nav>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
