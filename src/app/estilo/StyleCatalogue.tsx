"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  IntentCards,
  Mascot,
  Modal,
  SafetyAlert,
  Spinner,
  Stepper,
  Uploader,
  type UploaderFile,
} from "@/ui";
import { TRADES } from "@/config/trades";
import styles from "./catalogue.module.css";

const demoFiles: UploaderFile[] = [
  { id: "1", name: "salon.jpg", progress: 100, status: "done" },
  { id: "2", name: "detalle.jpg", progress: 45, status: "uploading" },
  { id: "3", name: "etiqueta.png", progress: 0, status: "error", error: "Formato no admitido" },
];

export function StyleCatalogue() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className={styles.page}>
      <h1>Catálogo de estilo — Praetoria Servicios</h1>
      <p className={styles.lead}>
        Referencia interna del sistema de diseño (issue #3). No indexable.
      </p>

      <section>
        <h2>Mascota y arco emocional</h2>
        <div className={styles.row}>
          <figure>
            <Mascot mood="worry" label="Preocupación" />
            <figcaption>Problema</figcaption>
          </figure>
          <figure>
            <Mascot mood="progress" label="En marcha" />
            <figcaption>Análisis</figcaption>
          </figure>
          <figure>
            <Mascot mood="relief" label="Alivio" />
            <figcaption>Solución</figcaption>
          </figure>
        </div>
      </section>

      <section>
        <h2>Botones</h2>
        <div className={styles.row}>
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Peligro</Button>
          <Button loading>Cargando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </section>

      <section>
        <h2>Campos</h2>
        <div className={styles.narrow}>
          <Field label="Nombre" hint="Como quieres que te llamemos" />
          <Field label="Teléfono" required error="Introduce un teléfono español válido" />
          <Field as="textarea" label="¿Qué ocurre?" hint="Cuéntalo con tus palabras" />
        </div>
      </section>

      <section>
        <h2>Feedback</h2>
        <Alert tone="info" title="Información">
          Esto es orientativo.
        </Alert>
        <Alert tone="success" title="Enviado">
          Hemos recibido tu solicitud.
        </Alert>
        <Alert tone="warning" title="Revisa">
          Falta una foto de detalle.
        </Alert>
        <Alert tone="danger" title="Error">
          No hemos podido procesarlo.
        </Alert>
        <SafetyAlert
          heading="Antes de seguir, tu seguridad"
          instructions={[
            "Cierra la llave de paso si puedes hacerlo con seguridad.",
            "No toques la instalación eléctrica si hay agua.",
          ]}
        />
      </section>

      <section>
        <h2>Progreso</h2>
        <Stepper
          steps={[
            { key: "a", label: "Categoría" },
            { key: "b", label: "Fotos" },
            { key: "c", label: "Explicación" },
            { key: "d", label: "Contacto" },
          ]}
          current={1}
        />
        <Spinner label="Analizando" />
      </section>

      <section>
        <h2>Estado vacío</h2>
        <EmptyState
          title="Todavía no hay solicitudes"
          description="Cuando llegue la primera, aparecerá aquí."
          action={<Button>Crear una de prueba</Button>}
        />
      </section>

      <section>
        <h2>Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="¿Seguro que quieres cancelar?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                No
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                Sí, cancelar
              </Button>
            </>
          }
        >
          Se perderá la información que has introducido.
        </Modal>
      </section>

      <section>
        <h2>Entradas por intención</h2>
        <IntentCards onSelect={() => {}} />
      </section>

      <section>
        <h2>Uploader</h2>
        <Uploader
          files={demoFiles}
          accept="image/*"
          maxReached={false}
          onPick={() => {}}
          onRemove={() => {}}
          onRetry={() => {}}
          onMove={() => {}}
        />
      </section>

      <section>
        <h2>Iconos de oficio</h2>
        <div className={styles.icons}>
          {TRADES.map((t) => (
            <span key={t.key} className={styles.iconCell}>
              <Icon name={t.key as never} size={28} title={t.label} />
              <small>{t.label}</small>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Tarjetas</h2>
        <div className={styles.row}>
          <Card>Tarjeta simple</Card>
          <Card interactive>Tarjeta interactiva</Card>
        </div>
      </section>
    </main>
  );
}
