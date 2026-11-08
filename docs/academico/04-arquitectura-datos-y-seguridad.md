# Arquitectura, datos y seguridad
Estado: diseño y base implementada, 7/11/2026. Windows/Chrome; Node 24. Servicio local 127.0.0.1:4180. Laboratorio 4178 independiente.

## Componentes y decisiones
| ADR | Decisión y motivo | Límite/alternativa |
|---|---|---|
| ADR01 | React/TypeScript/Vite/Tailwind; Radix y componentes estilo shadcn; Motion | Interfaz web local, sin empaquetar escritorio |
| ADR02 | Node/TypeScript/Fastify/Zod | Un lenguaje; Python/Rust/Go no necesarios |
| ADR03 | SQLite con Drizzle y better-sqlite3; WAL | Driver estable compatible; no usar driver experimental ausente |
| ADR04 | Google mediante Supabase Auth y PostgreSQL | Requiere configuración; local funciona sin cuenta |
| ADR05 | SIWC individual, Responses con tokens autorizados del plan | No claves API; preview y cuota pueden cambiar |
| ADR06 | Audio del navegador, grabación local | Calidad/servicio ASR dependiente del proveedor |
| ADR07 | Eventos inmutables local-first; sync manual | Automatización y recuperación avanzada posteriores |
| ADR08 | DPAPI por usuario Windows | No portabilidad de secretos a otra cuenta/sistema |

Flujo: navegador → Fastify → SQLite. Tutor: Fastify → OpenAI con autorización propia. Audio: navegador → archivo local; al tutor va texto etiquetado speech/typed. Sync: SQLite → Supabase bajo sesión Google verificada/RLS → descarga paginada. Sin servidor central de inferencia ni computadora del promotor como backend de todos.

## Modelo
events(id UUID PK, owner, kind, created_at, data JSON, synced). Tipos attempt, review, conversation, audio. Intento: activityId, answer, source, assisted, mode, selfReview y resultado calculado en servidor. Review conserva estado FSRS y fecha. Conversación conserva pregunta/respuesta/modelo. Audio guarda identificador/MIME; bytes en directorio por hash de owner.

owner=device es espacio compartido local, no cuenta autenticada. owner=UUID Supabase se deriva de getUser verificado; el cliente no lo elige. Sesiones/cookie aleatoria HttpOnly SameSite=Lax; CSRF distinto por sesión. Sesión Google en memoria; tras reinicio necesita login. Tokens ChatGPT por owner en archivos DPAPI, no DB/browser/nube. Reconexión manual al caducar, renovación automática pendiente.

Sync sube eventos con user_id de sesión y descarga solo propios. UUID evita duplicación y contenido distinto con el mismo ID se rechaza. RLS permite SELECT/INSERT propios, no UPDATE/DELETE. Eventos de audio excluidos. FSRS toma última revisión por tiempo; concurrencia entre dispositivos/relojes necesita pruebas y política de desempate más robusta. Sync real de dos cuentas todavía no validado.

## Controles y amenazas
| Amenaza | Control implementado | Riesgo residual |
|---|---|---|
| Web externa escribe en servicio | Host exacto, Origin permitido y token CSRF | Procesos locales con acceso al usuario Windows |
| OAuth login CSRF/replay | PKCE, state/nonce, cookie, TTL, intento consumido | Integración nueva requiere pruebas reales |
| Falsa identidad | JWKS/RS256, issuer/audience/exp/nonce/sub | Dependencia en proveedor e internet |
| Filtración de tokens | DPAPI, logs desactivados, sin secretos en backup | Proceso bajo mismo usuario Windows puede descifrar |
| Lectura cruzada | Filtrar por owner y RLS en nube | Política debe probarse con dos cuentas |
| Pérdida de datos/red | SQLite antes de sync, respaldo privado | Importador/recuperación guiada pendientes |
| XSS en respuestas | React escapa texto; no HTML del LLM | Auditoría formal de dependencias pendiente |
| Uso de créditos | Sin clave/fallback y confirmación explícita | La app no puede inspeccionar ajuste del proveedor |

No exponer puerto fuera de loopback. No sincronizar tokens ni grabaciones. Base de aprendizaje sin cifrar: proteger sistema/disco/copias. Audio solo por acción del usuario y máximo 10 MB; grabación tiene límite de seguridad cinco minutos. Política de borrado/retención configurable pendiente antes de uso multiusuario amplio.

API: GET session/catalog/progress/backup/models/audio/:id; POST attempts/review/audio/tutor/sync/logout/chatgpt/disconnect. Mutaciones validan Zod y CSRF. No prometer evaluación acústica. Timeout de tutor 90 s, fallos no se guardan como respuestas completas. La implementación nueva devuelve respuesta completa; streaming visual queda para mejora.

## Referencias técnicas
- [Sign in with ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source/sign-in).
- [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference).
- [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations).
- [Supabase Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [FSRS TypeScript](https://github.com/open-spaced-repetition/ts-fsrs).



Vocabulary 0.4 añade almacenamiento local por propietario, tarjetas por significado/versión/dirección y resultados idempotentes, sin modificar eventos previos ni sincronizar a Supabase. [Contratos y compatibilidad](12-incremento-0.4.md).


Grammar 0.5 añade sesiones versionadas, respuestas, ayudas y tarjetas por objetivo en SQLite local, con aislamiento, revisiones e idempotencia. [Contratos y respaldo](13-incremento-0.5.md). Sin migración remota ni cambios a eventos anteriores.
