# Validación y cierre académico preparado
Fecha real de este registro: 7/11/2026. Cierre previsto 4/12/2026. **No cerrado ni aceptado**.

Actualización 8/11: evidencia del capítulo 0.2, renovación y feedback real separada en [10-incremento-0.2.md](10-incremento-0.2.md). Los resultados del 7/11 siguientes se mantienen como históricos, no como pruebas ejecutadas sobre toda versión futura.

## Estrategia
Vitest: contrato de contenido, evaluación sin notas oficiales, SQLite real, idempotencia/inmutabilidad (incluido orden de claves JSONB), aislamiento, CSRF/Host, FSRS, audio y OAuth inválido. Pruebas de proveedor se simulan donde corresponde para evitar gasto de IA. CUA: interfaz real y recorrido de guardado. Playwright: suite preparada para repetir flujo en perfil aislado. Usuario: micrófono físico, consentimiento y nueva tutoría real. Supabase: dos cuentas y RLS en proyecto configurado.

## Resultados reales iniciales
- npm run build: TypeScript y bundle Vite completados.
- npm test: **12 pruebas aprobadas** (4 contenido, 8 servicio/aislamiento), ejecutadas 7/11/2026.
- Regresiones heredadas: **6 aprobadas**, incluyendo pausa manual, provenance oral, streaming incompleto, límites y OAuth. La primera ejecución de OAuth fue bloqueada por sockets del sandbox; pasó al ejecutarse con permisos de red local.
- Playwright con Chrome: **4 aprobadas**, dos escenarios en escritorio y móvil; guardado de cuatro habilidades, persistencia, ayudas ocultas, tema oscuro y ausencia de desbordamiento horizontal en el recorrido probado. No se usó micrófono ni IA real en estas pruebas.
- Windows DPAPI con datos ficticios: escritura cifrada, recuperación y eliminación verificadas. Esto no constituye una prueba de autorización real de ChatGPT.
- HTTP GET de nueva aplicación: 200.
- Navegación visual y guardado: Reading, Listening, Speaking con respuesta escrita de prueba y Writing guardados; Portfolio mostró cuatro intentos. **Speaking escrito no valida grabación/micrófono**.
- Laboratorio anterior: autorización propia y conversación/audio confirmados por el usuario; no extrapolar esa evidencia a todas las conexiones nuevas.
- OAuth/Google/RLS reales nuevos, eficacia pedagógica, compatibilidad extensa y dos simulacros: **pendientes**. DPAPI fue probado con datos ficticios; falta el recorrido con credenciales autorizadas reales.
- Guardados de demostración del desarrollador en workspace local son evidencia de software, no rendimiento del alumno.

Resultados posteriores se agregarán con fecha y comando reales, conservando fallos/limitaciones. La prueba de login/sync no puede declararse aprobada sin proyecto configurado.

## Protocolo pendiente
Repetir después de correcciones: build/tests, pruebas visuales responsive/claro/oscuro, recorrido con cuatro habilidades, pausa manual, grabación/reproducción y transcripción física, tutor sin crítica de formato oral, desconexión, cuenta separada y nube inaccesible. Revisar distractores, exactitud y naturalidad antes de reviewed. Ensayar copia/recuperación con servicio detenido.

## Cierre académico a completar al ocurrir
| Campo | Valor actual |
|---|---|
| Fecha de entrega | Provisional 4/12/2026; real pendiente |
| Versión entregada / hashes | Pendiente de congelación |
| Alcance implementado | Según estado de versión y evidencia |
| Diseñado/no implementado | Registrar sin ocultar |
| Pruebas y defectos aceptados | Pendientes de revisión final |
| Aceptante y decisión | Pendientes |
| Lecciones aprendidas | Iniciales abajo; ampliar con hechos reales |

Lecciones iniciales: separar salida de producto y beneficio educativo; etiquetar transcript speech evita feedback injusto; documentar banco draft impide exagerar cobertura; un hito académico no obliga a finalizar todo el producto. Son observaciones de desarrollo, no conclusiones de aprendizaje.

Al congelar: capturar fuentes/lockfile/documentos/resultados, identificar 0.x-academic-2026-12-04 según fecha real, calcular SHA-256 y guardar paquete privado sin .local/secretos. Mejoras posteriores en versiones nuevas; no alterar evidencia pasada. No crear informe firmado ni retrospectiva ficticia.




Verificación 0.4: [registro de Vocabulary](12-incremento-0.4.md), con evidencia automática separada de revisión humana pendiente. No cambia los hitos del 1 y 4 de diciembre de 2026 ni declara eficacia educativa o cierre académico.


Verificación 0.5: [registro de Grammar](13-incremento-0.5.md). Evidencia simulada separada de validación real y revisión humana pendiente. Fechas académicas 1/12 y 4/12/2026 sin cambios.


## Actualización 0.6 (8/11/2026)

La preparación de la beta web, cuentas privadas y evidencia actual se describe en [incremento 0.6](14-incremento-0.6.md). El [manual de despliegue](../despliegue-web.md) distingue implementación, comprobaciones SQL reales y validación publicada pendiente. Las secciones anteriores conservan su alcance histórico. No se considera aceptada la beta con IA hasta resolver Google/Vercel y GPT remoto autorizado.
