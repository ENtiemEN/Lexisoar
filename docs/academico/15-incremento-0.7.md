# LexiSoar 0.7 · Stories, salida y Practice

Registro del 10/11/2026. Incremento implementado para revisión; publicación de este código y aceptación con una cuenta invitada todavía pendientes. El usuario confirmó que la versión anterior funciona en producción. Documentación completa: 1/12/2026; entrega académica provisional: 4/12/2026.

## Entregables y alcance

- Catálogo de diez historias originales, libre elección y portadas SVG locales. La historia de Mill Street conserva IDs, versión y evidencia previa. Las nueve nuevas se identifican como **Draft · human review pending** en información editorial desplegable.
- Cada historia incluye un documento propio, conversación con interlocutores/roles identificables, comprensión, postura oral, email contextual y recuperación de tres palabras. Las situaciones abordan evidencia histórica, reutilización, accesibilidad, espacios compartidos, transporte nocturno, trabajo, reparación, lluvia y acceso a una biblioteca.
- Start story / Continue / Start again y Previous runs. Reiniciar crea otro identificador; no elimina intentos. Home continúa el recorrido pendiente actualizado más recientemente y ofrece Browse stories.
- Sesenta títulos específicos de Practice con tipo y tema como información secundaria. Se preservan los IDs, estímulos, respuestas, corrección, orden y métricas existentes. Vocabulary y Grammar mantienen su alcance.

## Salida y recuperación

Pause & exit coordina una sola operación: parar síntesis/reproducción, reconocimiento y micrófono; guardar transcripción/texto; resolver audio; marcar pausa y salir. Los clics repetidos comparten el flujo. Un autoguardado anterior conserva cualquier edición posterior, y los conflictos no se resuelven sobreescribiendo otro dispositivo.

Las peticiones tienen límite de espera (30 s; subida directa 60 s). La finalización de captura tiene una espera máxima de 5 s y el permiso de micrófono 15 s. Stop waiting cancela el guardado/subida en curso para poder elegir una recuperación; no significa que el servidor haya deshecho una operación recibida.

Si falla el audio: Retry upload, Download recording, Stay o Exit without recording. Salir requiere reconocer explícitamente el descarte; se conserva la transcripción. Si falla el texto: Retry save, Download draft, Stay o Exit with local draft, también con confirmación. El respaldo pendiente se conserva por propietario/dispositivo si el almacenamiento del navegador está disponible; la descarga permite conservarlo incluso si no lo está. Los conflictos ofrecen la versión guardada, sin mezclar automáticamente borradores incompatibles.

Una captura interrumpida al cerrar la pestaña no se declara recuperada. Un archivo que llegó a Storage pero cuyo enlace falló puede existir allí aunque el recorrido aún no lo muestre: Retry upload vuelve a finalizar el mismo identificador. Settings permite revisar/eliminar grabaciones guardadas; salir sin grabación no afirma que un archivo huérfano haya sido borrado.

## Diseño técnico y seguridad

`Chapter.presentation` contiene escenario, documento, diálogo, fuentes, destinatario y asunto. Los snapshots antiguos sin este campo usan una presentación compatible de Mill Street; no se reescriben. El reproductor toma el material del capítulo seleccionado.

Cada Blob conserva un UUID estable en la sesión del navegador. Reserva, subida y finalización son reintentables con ese UUID; no se vuelve a subir un objeto ya presente. La finalización vuelve a enlazar el evento tras un conflicto de workspace y no duplica un evento confirmado. La API local acepta el mismo UUID y comprueba bytes/MIME en los reintentos.

La migración aditiva `20261110054334_lexisoar_audio_resume.sql` renueva la reserva pendiente de un mismo archivo con bloqueo por propietario, sin crear otra fila. Conserva 10 MB por archivo, 100 MB por usuario y reserva máxima durante las URLs firmadas (125 min). No modifica tablas de aprendizaje ni permisos de lectura. La función solo puede ejecutarla service_role; secretos siguen en servidor.

Referencias técnicas consultadas: [Storage info](https://supabase.com/docs/reference/javascript/storage-from-info), [URLs de subida firmadas](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

## Verificación y evidencia

- Pruebas unitarias/integración: diez historias completas, 60 títulos únicos, compatibilidad del snapshot previo, cuatro habilidades de cada historia, vocabulario/fin, reinicio, aislamiento y grabación local idempotente.
- Gateway/Storage simulado: archivos ausentes o incompatibles, identidad ajena, conflicto después de subir, respuesta perdida, reintento sin otra subida ni evento duplicado y recorrido nuevo persistido entre invocaciones independientes.
- Navegador: selección, reinicio/historial, borradores, pausa oral manual, salida con fallo de audio, confirmación de descarte, conflicto de texto, descarga y edición mientras un autoguardado anterior está pendiente. Regresiones de Vocabulary, Grammar, Progress, Practice y login.
- SQL real en Supabase: migración aplicada; prueba transaccional revertida de renovación, identidad, diez reservas, rechazo de la undécima y reintento de la misma. Verificados permisos: anon=false, authenticated=false, service_role=true.
- Los asesores no detectan incidencias de rendimiento; seguridad informa protección de contraseñas filtradas deshabilitada, ajena al cambio y al acceso exclusivo con Google. [Referencia del asesor](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Capturas locales: `output/verification/v07-stories-desktop.png` y `v07-stories-mobile.png`, generadas por Playwright; no se versionan.

Resultados: 104 pruebas Vitest aprobadas, 52 Playwright aprobadas y 6 regresiones Node aprobadas; build/TypeScript y comprobación ESM nativa aprobados. La verificación final de Stories/Chapter comprende 18 pruebas aprobadas sobre el build final, incluidas dos comprobaciones adicionales (escritorio/móvil) de pausa desde todas las escenas; el total distinto de pruebas de navegador es 54. Un sondeo opcional del laboratorio GPT antiguo no pudo inicializar Codex (timeout); no llegó a solicitar generación y no se cuenta como validación GPT. Servicios Storage/GPT simulados y micrófono sintético no se presentan como verificación real de audio en producción. Pendientes: push/despliegue por el usuario, recorrido con invitado en la versión publicada, micrófono físico, revisión humana del contenido y evaluación formal de accesibilidad/usabilidad. GPT remoto continúa sujeto a autorización independiente; no se modificó su integración ni se usaron créditos.

## Aceptación humana

Elegir cualquier historia; leer/escuchar/producir; pausar; continuar; reiniciar sin perder el anterior; encontrar una práctica por su título. Ante un fallo, comprobar que se puede reintentar o salir con una decisión explícita y una copia del trabajo. La aceptación editorial y pedagógica no se deduce de las pruebas automáticas ni implica puntuación TOEFL, nivel o eficacia demostrada.
