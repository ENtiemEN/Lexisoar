# Alcance, EDT y diccionario
Línea propuesta 7/11/2026. EDT orientada a entregables; el incremento académico y el producto completo son distintos.

| Código | Entregable / inclusión | Terminación verificable | Dependencia |
|---|---|---|---|
| 1.1 | Gobierno: acta, interesados, alcance y registros | Objetivos, autoridad y restricciones explícitas | Ninguna |
| 1.2 | Investigación y pedagogía | Doce formatos, fuentes y medición | 1.1 |
| 1.3 | UX y arquitectura | Dos direcciones, recorrido y ADR revisables | 1.2 |
| 1.4 | Plataforma y datos | Arranque, persistencia e identidad comprobables | 1.3 |
| 1.5 | Incremento cuatro habilidades | Responder/revisar/reintentar/guardar | 1.2,1.4 |
| 1.6 | Validación | Pruebas reproducibles y defectos registrados | 1.4,1.5 |
| 1.7 | Expediente integrado | Manual, trazabilidad y revisión 1–3/12 | 1.1–1.6 |
| 1.8 | Cierre académico | Paquete/versionado y entrega real 4/12 | 1.7 |
| 2.1 | Banco revisado | Cinco conjuntos por cada formato aprobados | Incremental/posterior |
| 2.2 | Diagnóstico y simulacros | Orientación individual y dos pruebas lineales | 2.1 |
| 2.3 | Continuidad | Sync probado, recuperación y acabado | Integración externa |

Responsable: Enrique. Revisión de contenido y aceptación del curso requieren personas/evidencia reales. Los 60 borradores no completan 2.1.

| ID | Requisito | Criterio |
|---|---|---|
| R01 | Inglés integral | UI, ayudas y errores al estudiante en inglés |
| R02 | Cuatro habilidades/doce formatos | Estímulo, respuesta y persistencia en cada formato |
| R03 | Guardado local primero | Reabrir DB conserva intentos sin nube |
| R04 | Datos por identidad | Dos cuentas no leen ni modifican eventos ajenos |
| R05 | Control de voz | Pausa no envía; Stop, revisión y envío explícitos |
| R06 | Feedback oral adecuado | Sin puntuación de pronunciación ni críticas al formato ASR |
| R07 | IA propia | Consentimiento individual, sin claves API ni pago automático |
| R08 | Secretos protegidos | Fuera del browser/nube; DPAPI y desconexión |
| R09 | Repaso/reintento | FSRS persistido, intentos anteriores intactos |
| R10 | Juego y progreso | Esfuerzo separado de dominio; sin vidas que bloqueen |
| R11 | Sync | Fallo de nube no pierde datos; RLS/idempotencia |
| R12 | Entrenamiento/independiente | Ayudas diferenciadas; sin fingir simulacro |
| R13 | Banco completo | 60 conjuntos revisados, exactos y originales |
| R14 | Diagnóstico/simulacros | Orientativo; dos aproximaciones completas etiquetadas |
| R15 | Evidencia | Versiones y fechas auténticas; pendientes explícitos |

No funcionales: Windows/Chrome; teclado, diseño adaptable y errores recuperables; timeout de tutor; logs sin secretos. Medir latencia mediana/p95 con muestra real, sin convertir un resultado del laboratorio en garantía.

Hecho por cambio: requisito/código/documentación coherentes, compilación, pruebas pertinentes, revisión UX si cambia interfaz y límites registrados. Hecho académico añade trazabilidad, manual y paquete congelado. Aceptación del docente pendiente.

