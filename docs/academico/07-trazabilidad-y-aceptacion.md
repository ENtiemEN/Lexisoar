# Trazabilidad y aceptación
Estado: matriz inicial 7/11/2026. Implementado no significa validado externamente ni aceptado por docente.

| Necesidad → requisito | Entregable | Evidencia actual / pendiente |
|---|---|---|
| Inglés comprensible → R01 | UI/contenido | src/App.tsx y shared/content.ts; revisión humana pendiente |
| Practicar cuatro habilidades → R02 | Banco y recorrido | tests/learning.test.ts; recorrido visual inicial |
| No perder progreso → R03 | SQLite | tests/service.test.ts: reabrir DB conserva intento |
| Avance individual → R04 | Identidad/datos | aislamiento Store probado; Google/RLS pendiente |
| Control oral → R05 | Voz | src/useVoice.ts; regresión del laboratorio; mic físico pendiente |
| Corrección justa → R06 | Tutor/assessment | probes/tutor-service.test.mjs; source explícito |
| No pagar por tokens → R07 | SIWC | consentimiento previo del laboratorio; nueva conexión pendiente |
| Proteger cuenta → R08 | Vault | server/vault.ts; DPAPI real pendiente |
| Recordar/revisar → R09 | FSRS/portafolio | prueba de fecha FSRS y eventos inmutables |
| Diversión/progreso → R10 | Today/Progress | UI y puntos de esfuerzo; usabilidad pendiente |
| Recuperar entre equipos → R11 | Sync/RLS | esquema/código; dos cuentas reales pendientes |
| Ayudas diferenciadas → R12 | ActivityView | independiente oculta hints/tutor; revisión visual |
| Banco fiable → R13 | 60 conjuntos revisados | Solo 60 actividades draft; requisito no satisfecho |
| Orientación/examen → R14 | Diagnóstico/simulacros | Diseñado; sin implementar |
| Entrega honesta → R15 | Expediente/paquete | Fechas corregidas; congelación/aceptación futuras |

## Puerta académica del 4/12
- Documentación integrada, coherente y revisada (meta 1/12, revisión 2–3).
- Versión identificable y evidencia reproducible del incremento disponible.
- Recorrido acotado con las cuatro habilidades y guardado.
- Pruebas de persistencia, separación de usuarios y controles de voz según lo implementado.
- Tutoría y configuración externa con su evidencia real o limitación explícita acordada.
- Funciones implementadas, diseñadas y pendientes claramente separadas.
- Sin atribuir puntuación oficial, eficacia causal, pronunciación ni C2 no validados.

Responsable del registro: Enrique. Aceptante académico: docente, no identificado en esta sesión. Resultado final: **pendiente**. No marcar aprobado por la existencia del documento.


Actualización 0.3: requisitos y resultados de Progress en [incremento 0.3](11-incremento-0.3.md). Aceptación humana de localización rápida pendiente; pruebas técnicas aprobadas no equivalen a eficacia educativa.


Actualización 0.4: [matriz de Vocabulary y verificación](12-incremento-0.4.md). Se exige funcionamiento sin historias/GPT, persistencia, separación de direcciones/versiones, compatibilidad y ausencia de análisis oculto. La revisión humana permanece pendiente.


Actualización 0.5: [matriz y aceptación de Grammar](13-incremento-0.5.md). Evaluación humana del contenido y eficacia siguen pendientes; las pruebas técnicas no las sustituyen.


## Actualización 0.6 (8/11/2026)

La preparación de la beta web, cuentas privadas y evidencia actual se describe en [incremento 0.6](14-incremento-0.6.md). El [manual de despliegue](../despliegue-web.md) distingue implementación, comprobaciones SQL reales y validación publicada pendiente. Las secciones anteriores conservan su alcance histórico. No se considera aceptada la beta con IA hasta resolver Google/Vercel y GPT remoto autorizado.


## Trazabilidad 0.7 (10/11/2026)

R07-SALIDA → useVoice/useStudy/ChapterPlayer y ExitRecovery → pruebas stories/chapter/web-cache/cloud-gateway. R07-CATALOGO → chapters/story-catalog/StoriesView → diez historias, cuatro habilidades, reinicio e aislamiento. R07-PRACTICE → content/LegacyApp → 60 títulos únicos, IDs y respuestas conservados. La aceptación humana publicada sigue pendiente. Véase [incremento 0.7](15-incremento-0.7.md).
