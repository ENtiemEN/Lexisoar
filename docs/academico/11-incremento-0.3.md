# Incremento 0.3 · Progress visual y accionable

Estado de trabajo al 8/11/2026. Documentación completa el 1/12, revisión 2–3/12 y entrega académica provisional el 4/12/2026. No constituye aceptación académica ni validación de eficacia pedagógica.

## Entregable implementado

Progress sustituye el listado principal por cinco bloques: siguiente foco, distribución entre cuatro habilidades, evidencia de aprendizaje, dificultades y recuperación de vocabulario. Conserva violeta, logo, modo oscuro y navegación inmersiva. Gráficos SVG locales con etiquetas, valores accesibles y selección por teclado/tacto. Historial filtrable y paginado bajo View history; respuestas, capítulos y grabaciones permanecen disponibles.

Periodo inicial de 28 días; alternativas 7, 90 y todo el historial. Las fechas usan la zona horaria del navegador. El gráfico identifica los resultados y su escala; las ausencias de evidencia son huecos, no resultados de cero.

## Definiciones y límites de medición

- Práctica: primeras respuestas por habilidad, días activos y reintentos separados. En biblioteca antigua, la primera respuesta es la más antigua de la actividad; en capítulos se sigue la cadena de intentos dentro de una ejecución. No se muestran minutos sin medición fiable.
- Rendimiento objetivo: numerador/denominador de preguntas cerradas en primeras respuestas sin ayuda. No se convierten respuestas abiertas en aciertos objetivos. Las ayudas siguen contando como práctica, pero quedan fuera de evidencia independiente y recurrencias.
- Tutor: cumplimiento, evidencia, desarrollo, organización y claridad. Cada criterio puede estar demostrado, necesitar trabajo o no ser observable. Los dos primeros estados requieren cita literal del intento. Ausencia de crítica no implica dominio.
- Cohortes: separar tipo de tarea, versión del contenido, rúbrica y modelo. Comparación con periodo anterior equivalente únicamente dentro de cohortes compatibles. Se requieren cinco primeras respuestas evaluables en cada periodo para concluir tendencia: regla inicial del producto, sin significación estadística garantizada. Todo el historial no tiene periodo anterior comparable.
- Patrones: recurrente exige tres primeras respuestas y dos actividades distintas. Antes se etiqueta observación reciente. Se muestran hasta tres con frecuencia, ejemplos propios y práctica disponible. No se saltan requisitos del capítulo.
- Reintentos: cambios dentro del mismo ejercicio; nunca prueba de mejora general. Criterios del tutor comparables solo con mismo modelo/rúbrica.
- Repaso: tarjetas pendientes actuales y distribución Again/Hard/Good/Easy del periodo, explícitamente autoinformada. Una repetición no demuestra dominio.

El botón de ayuda del capítulo marca futuras respuestas como ayudadas; no se inventan ayudas retrospectivas para registros antiguos. No se califican mayúsculas/puntuación del reconocimiento hablado ni pronunciación, MCER o puntuación TOEFL.

## Arquitectura, privacidad y compatibilidad

GET /api/progress/summary recibe periodo y zona horaria; GET /api/progress/history pagina el historial. Todas las consultas están restringidas al propietario. Abrir Progress no llama a GPT ni modifica eventos.

Las observaciones se generan en la misma solicitud del feedback nuevo del capítulo. Una evaluación inválida conserva el feedback textual válido y permite continuar. SQLite añade progress_assessments con intento, versión de rúbrica, modelo, huella de la respuesta y estado. Los eventos anteriores no se modifican.

El historial permite seleccionar hasta diez respuestas abiertas, confirmar uso exclusivo del plan y solicitar análisis explícito. Las respuestas completas se reutilizan; fallos requieren reintento explícito. No se reinterpreta automáticamente feedback antiguo ni se inventan categorías. Salir de la vista detiene los siguientes elementos de la selección; una solicitud ya enviada puede terminar y quedar guardada.

Las evaluaciones se incluyen como campo aditivo en el respaldo textual versión 2. No se sincronizan a Supabase; grabaciones y credenciales siguen excluidas del JSON. El modo local continúa siendo un espacio compartido bajo la cuenta Windows; aislamiento por identidad Google requiere configuración y validación real existentes.

## Fundamento y aplicación

[Harkin et al.](https://www.apa.org/pubs/journals/releases/bul-bul0000025.pdf): seguimiento del avance como apoyo a objetivos; aquí cada observación conduce a una acción disponible. No se afirma transferencia causal automática al aprendizaje de idiomas.

[Mayer y Moreno](https://carpentries.github.io/instructor-training/files/papers/mayer-reduce-cognitive-load-2003.pdf): reducir material incidental; aplicación propuesta mediante jerarquía visual y detalles desplegables, pendiente de comprobación con usuarios.

[Revisión de dashboards educativos](https://arxiv.org/abs/2312.15042): un panel no garantiza mejores resultados. No se atribuye eficacia pedagógica al incremento por superar pruebas técnicas.

## Trazabilidad y verificación

| Requisito | Implementación | Evidencia |
|---|---|---|
| Distribución y próxima acción | ProgressView, progress-summary | Pruebas de datos vacíos, cantidades y rutas |
| Evidencia diferenciada y compatible | Cohortes, denominadores, muestra mínima | tests/progress.test.ts |
| Dificultades respaldadas | Criterios, citas, umbrales de recurrencia | Validación de cinco criterios y primeras respuestas |
| Sin análisis oculto | Lecturas separadas del POST explícito | Pruebas API y navegador sin llamadas al abrir |
| Historial y propietario | Filtros, paginación, almacén por propietario | Aislamiento, caché, respaldo y respuesta intacta |
| Compatibilidad | Sin reescribir eventos ni feedback antiguo | Regresiones del capítulo y laboratorio |
| Acceso visual | Escritorio/móvil, claro/oscuro, foco y reducción de movimiento | Capturas en output/verification; datos sintéticos |

Verificación técnica: compilación y 35 pruebas Vitest, seis regresiones Node y 18 pruebas Playwright aprobadas (escritorio/móvil). Las pruebas de navegador utilizan servidor temporal aislado y proveedor simulado; no alteran la base de uso personal. La prueba real separada output/verification/v03-real-observations.json envió una respuesta ficticia, obtuvo cinco criterios válidos con gpt-6-luna en 13,617 s y no modificó intentos. Comprobar estructura/citas no demuestra exactitud pedagógica del juicio del modelo.

Pendiente: prueba breve humana para localizar distribución, dificultad y acción; revisión formal de accesibilidad; validación pedagógica longitudinal; sincronización remota de evaluaciones. La prueba de voz automatizada simula navegador; no sustituye micrófono físico. Conservar evidencia 0.1/0.2 y esta versión identificable sin alterar retrospectivamente resultados.

