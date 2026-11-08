# Incremento 0.6 · LexiSoar, cuentas y preparación web

Fecha real: 8 de noviembre de 2026. Nombre anterior: Stride. Se mantienen documentos completos el **1/12/2026** y entrega provisional el **4/12/2026**. Este incremento no equivale a aceptación de la beta publicada con IA.

## Entregado y estado

| Entregable | Estado y evidencia |
|---|---|
| Identidad LexiSoar | Implementada en interfaz y metadatos; conserva violeta y símbolo de audio |
| API web Vercel | Implementada y probada con transporte Supabase simulado; despliegue real pendiente |
| Auth Google | OAuth PKCE y cookies cifradas implementados; falta configurar proveedor y probar consentimiento real |
| Invitaciones | Dos direcciones autorizadas insertadas por MCP; hook SQL preparado y comprobado, activación en Auth pendiente |
| Persistencia PostgreSQL | Dos migraciones aplicadas a `oaugxeahyjesdfrdfzwy`; CAS, RLS y cuota comprobados en base real |
| Recuperación | Snapshots de todos los almacenes; escritura confirmada, conflictos 409 y borradores locales pendientes por propietario |
| Audio privado | Reserva, subida firmada, finalización, lectura y borrado implementados; prueba con Storage desde el dominio publicado pendiente |
| Importación | Versión 2, cuenta vacía, validación, materiales canónicos y deduplicación; respuestas importadas no se cuentan como aciertos verificados |
| GPT local | Conservado; regresiones con proveedor simulado y OAuth del laboratorio pasan |
| GPT remoto | Deshabilitado; acceso oficial y recorrido real pendientes. No existe fallback de pago |
| Documentación operativa | [Manual web](../despliegue-web.md), variables de servidor y procedimiento de reversión |

## Arquitectura y decisiones

La interfaz usa las mismas rutas `/api/*`. El gateway web verifica Google y la invitación antes de cargar datos, valida origen y CSRF para escrituras y ejecuta la corrección con el código existente en servidor. No toma un `user_id` enviado por el navegador como propietario. Cifra sesión y verificador PKCE con AES-GCM mediante JOSE; cookies HTTP-only, Secure y SameSite=Lax. La renovación no depende de memoria de un proceso.

`lexisoar_workspaces` conserva la instantánea completa por usuario. Durante una petición se reconstruye en SQLite **en memoria**, se ejecutan las reglas existentes y se confirma una única revisión atómica en PostgreSQL. Vercel no necesita disco persistente. Es una decisión transitoria para esta beta pequeña, no una propuesta de escala ilimitada: todos los módulos mantienen atomicidad y reglas, a costa de leer y escribir la instantánea. Los límites de respaldo/instantánea y la futura normalización están documentados.

El cliente tiene lectura propia mediante RLS, sin permisos para escribir resultados ni ejecutar las funciones de commit/reserva. El gateway usa una clave secreta exclusivamente de servidor, después de verificar identidad e invitación. La función privada de invitación consulta al usuario actual verificado; nunca utiliza `user_metadata` para autorizar. Solo se usa el nombre de perfil como texto de presentación.

Storage permanece privado. La cuota usa bloqueo transaccional por usuario. Los enlaces de subida pendientes cuentan como reserva máxima durante su vigencia para evitar eludir la cuota borrando un archivo y reutilizando el enlace. Las capturas se eliminan desde Settings; el plazo de liberación se explica en la interfaz. Las URL de lectura caducan en 60 segundos.

No se migraron datos personales locales, no se copiaron tokens GPT, no se inició ni detuvo el servidor personal y no se contrataron servicios de pago. Los correos de invitados no se guardan en archivos versionados.

## Trazabilidad y aceptación

| Requisito | Verificación |
|---|---|
| WEB-01 login antes de datos | Gateway: sin sesión rechaza datos; navegador escritorio/móvil solicita Google sin cargar capítulos |
| WEB-02 separación | RLS real con dos identidades ficticias y revocación; gateway con usuarios alternados |
| WEB-03 resultados de servidor | Cliente no tiene UPDATE/commit; respuesta con resultado inventado se recalcula |
| WEB-04 persistencia | Nueva instancia por petición; recuperación de Stories, Grammar y Vocabulary; solicitudes repetidas y CAS concurrente |
| WEB-05 importación | Archivo real generado por la app; nuevas identidades, materiales actuales, invalidación de resultados importados y rollback de archivos inválidos |
| WEB-06 audio | Cuota SQL real; UI y controles existentes. Transporte Storage real pendiente |
| WEB-07 IA | Proveedor remoto cerrado; no llamadas al navegar; fallos simulados conservan respuestas |
| WEB-08 interfaz y regresión | 44 pruebas Playwright en escritorio/móvil; modos y reducción de movimiento en recorridos existentes; login/Settings nuevos |

Verificación final: build y TypeScript correctos; **94 pruebas Vitest**, **44 Playwright**, **6 regresiones Node**. Son 144 pruebas automáticas. Los recorridos de nube usan servicios simulados salvo las comprobaciones SQL expresamente indicadas. No equivalen a una validación publicada de Google, Vercel, Storage o GPT. Los test SQL con usuarios ficticios se revirtieron; no dejaron cuentas de prueba en producción. Los asesores de seguridad y rendimiento de Supabase devolvieron cero avisos al revisar las migraciones.

Limitaciones: importar requiere cuenta vacía; no se migran grabaciones; no hay fusión o sincronización automática local/web. Los borradores no confirmados se recuperan manualmente desde Settings. Respaldos muy grandes requieren futura fragmentación. Feedback importado es nota histórica y no evaluación verificada. El catálogo mantiene revisión humana pendiente y no se declara eficacia pedagógica o puntuación oficial.

## Acciones externas pendientes

1. Configurar Google OAuth y activar el hook Before User Created en Supabase.
2. Subir código, configurar Vercel con la URL definitiva y variables privadas; validar el binario SQLite de la función en Linux/Node 24 durante el despliegue real.
3. Probar ambos usuarios en el dominio publicado, incluyendo audio y otro dispositivo.
4. Resolver autorización GPT remota, implementar según el contrato oficial recibido y validar una cuenta elegible real antes de cerrar la beta con IA.

Referencias operativas y procedimiento detallado: [guía de despliegue](../despliegue-web.md). La evidencia posterior se registrará en nuevas revisiones, sin convertir retroactivamente estas pruebas simuladas en reales.
