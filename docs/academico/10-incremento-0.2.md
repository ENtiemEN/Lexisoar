# Incremento 0.2 · Capítulo inmersivo

Fecha real: **8 de noviembre de 2026 (America/Lima)**. Versión de software 0.2.0. Este registro complementa la evidencia histórica de 0.1, sin convertir pruebas futuras o simuladas en validación real.

## Entrega construida

Un capítulo original ficticio, **The night the city went quiet**, conecta aviso público, conversación con dos perspectivas, intervención oral, propuesta por email y recuperación de tres palabras. Tiempo estimado 20–30 minutos; todavía no medido en un piloto real. No es simulacro TOEFL ni contenido calibrado.

Inicio con continuar/empezar, mapa SVG original de contexto y navegación secundaria. Durante el capítulo: sin sidebar, acción principal por escena, material y respuesta juntos en escritorio, composición apilada en móvil, ayudas bajo demanda. El feedback ocupa el espacio de respuesta en vez de acumular paneles. Claro/oscuro, reducción de movimiento y pantalla completa opcional. Newsreader/Manrope se sirven desde el equipo con licencias OFL conservadas en ../licenses.

## Persistencia y compatibilidad

- Tablas SQLite aditivas: study_runs y study_feedback. No se eliminan ni reinterpretan eventos anteriores.
- Cada ejecución conserva propietario, capítulo completo/versionado, revisión, estado, escena, borradores, ayudas, referencias a intentos/audio, consentimiento y repaso. Autoguardado de texto después de 650 ms y antes de avanzar o salir.
- PATCH con revisión esperada: escrituras viejas devuelven 409, con opción de cargar la versión guardada. No se sobrescribe silenciosamente otro tab.
- Envío: intento inmutable primero; revisión de ejecución en la misma transacción. Reintentos enlazan el anterior, sin reemplazarlo.
- Voz: pausas no envían, Stop finaliza grabación y espera finalización de reconocimiento, revisión antes de enviar; el audio se guarda y vincula al intento. Pausar detiene y guarda antes de salir. Una captura interrumpida al cerrar el navegador no se promete recuperada.
- Estado de capítulo y feedback quedan **solo locales** en este incremento. Intentos/repasos siguen siendo eventos compatibles con sync existente; los borradores y snapshots no se sincronizan.
- Exportación JSON versión 2 incluye ejecuciones y feedback textual, sin audio ni secretos. Restauración guiada pendiente.

## Tutor contextual

La conexión con GPT de la aplicación fue confirmada por el usuario antes de este incremento. Se conserva autorización individual y DPAPI. Se añadió renovación de tokens con el client_id emitido y protección de credenciales rotadas; no se cambian cuentas ni permisos.

Feedback integrado optativo por capítulo, con confirmación de uso del plan y de créditos de apps desactivados por el titular. El programa no puede consultar esa preferencia. Para Speaking/Writing: guardar intento → enviar material, objetivo, respuesta, modalidad y anterior intento de esa escena → validar respuesta completa con Zod → persistir feedback. No se incluyen otras conversaciones.

Formato: un acierto observado, una mejora prioritaria, un ejemplo y consigna de reintento. Ejercicios cerrados tienen comprobación determinista y profundización opcional. Feedback completo se reutiliza; pendiente se consulta; fallo se conserva y solo se regenera con reintento explícito. No hay compra de créditos ni fallback. Sin nota oficial, acústica ni declaración automática de mejora.

## Interfaces nuevas

| Ruta | Función |
|---|---|
| GET /api/chapters | Catálogo versionado del capítulo |
| GET/POST /api/study-sessions | Listar ejecuciones propias o iniciar una |
| GET/PATCH /api/study-sessions/:id | Snapshot propio o actualización con revisión |
| POST /api/study-sessions/:id/attempts | Guardar intento e incorporar referencia al estado |
| GET/POST /api/attempts/:id/feedback | Consultar o solicitar feedback idempotente |
| POST /api/study-sessions/:id/review | FSRS y avance de recuperación, en transacción |

Validación Zod, protección de origen/CSRF y filtrado de propietario siguen activos. No se requiere migración de Supabase para estas tablas locales.

## Evidencia y límites

Resultado final del 8/11: **21 pruebas Vitest, 12 Playwright (6 escenarios × escritorio/móvil), 6 regresiones Node aprobadas; compilación TypeScript/Vite correcta**. Son 39 comprobaciones automáticas, además de la prueba real separada del generador. La captura de referencia del capítulo está en output/verification/v02-reading-desktop.png y las vistas de portada, móvil y oscuro en la misma carpeta. Los resultados generados no contienen credenciales.

- Pruebas de servidor: snapshots tras reapertura, datos antiguos intactos, aislamiento, conflictos, avance, FSRS, audio ajeno rechazado y feedback completo/fallido.
- Pruebas de navegador en Chrome: capítulo sin regresar al panel, autoguardado/recarga, pausa/retorno, reintentos, feedback simulado contextual/fallido, cierre y compatibilidad de biblioteca; escritorio y móvil.
- Voz en pruebas de navegador usa **MediaRecorder y reconocimiento simulados** para comprobar silencio, Stop, guardado y vínculo. No es prueba física de micrófono ni calidad acústica.
- Prueba real separada: scripts/verify-feedback.ts envió solo material ficticio y una respuesta ficticia etiquetada speech mediante el plan autorizado. Modelo devuelto por el catálogo: gpt-6-luna. Resultado estructurado válido en **5.757 s**; un caso, no garantía de latencia. Pidió evidencia del aviso y no criticó formato de la transcripción. Resultado: output/verification/v02-real-feedback.json (archivo generado local, sin credenciales).
- Comprobación real adicional: scripts/verify-chapter.ts ejecutó las rutas completas con datos de aprendizaje aislados en memoria: cuatro intentos, dos feedbacks reales (Speaking como transcript y Writing), reutilización del feedback ya guardado, tres palabras FSRS y cierre completed. Resultado: output/verification/v02-real-chapter.json. Duración total **10.522 s**; feedbacks **4.237 s** y **4.590 s** en ese caso. No leyó ni escribió intentos personales y no usó micrófono real.
- Estas comprobaciones no sustituyen un piloto humano completo ni una evaluación de calidad lingüística independiente.

Se detectaron y corrigieron dos fallos durante verificación: doble inicialización del cliente que podía cambiar la cookie antes de terminar el arranque; carrera al pausar cuando el blob de audio acababa de generarse. Mantener estos escenarios como regresiones.

Revisión visual/manual adicional: inicio y escenas observados en el navegador; en el diálogo de inicio, Shift+Tab vuelve al último control y Escape cierra/restaura foco. Se puede iniciar otra ejecución desde Start from the beginning sin eliminar la anterior. Auditoría accesible completa pendiente.

Pendientes explícitos: micrófono físico en esta versión, piloto de sesiones largas, auditoría WCAG integral, más capítulos, diagnóstico, adaptación, banco completo revisado, simulacros y configuración/pruebas reales de Supabase. El capítulo sigue marcado como práctica no calibrada. Las fuentes académicas del diseño se mantienen en 03-pedagogia-y-toefl.md.

## Trazabilidad y calendario

R01 inglés integral → escena/ayudas/errores; R02 cuatro habilidades → capítulo; R03 guardado → snapshots y CAS; R05 voz manual → pruebas simuladas y pendiente física; R06 feedback oral → provenance e instrucciones; R07–R08 → SIWC/DPAPI/renovación; R09 → FSRS/reintentos; R10 → avance de práctica sin dominio inventado; R15 → evidencia separada real/simulada. R11 sync, R13 banco revisado y R14 diagnóstico/simulacros mantienen su estado pendiente.

Sin cambio de fechas: documentación integrada **1/12/2026**, revisión **2–3/12**, entrega académica provisional **4/12**. Producto posterior con versiones nuevas; no modificar retrospectivamente el paquete que se entregue.

Referencias de implementación reconsultadas el 8/11: [inferencia SIWC](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [límites de preview](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) y [renovación/cuentas](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions). Se conserva store:false, stream:true y lectura hasta finalización; los datos de voz enviados al tutor siguen siendo texto.
