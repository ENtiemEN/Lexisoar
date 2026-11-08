# Planificación del proyecto de aprendizaje de inglés

Estado: planificación actualizada; ver ../academico/00-indice-y-estado.md para ejecución real.
Fecha: 7 de noviembre de 2026.

## Propósito

Crear una experiencia dinámica que motive al estudiante a practicar y desarrollar Reading, Listening, Speaking y Writing, con una ruta de preparación TOEFL iBT vigente y desarrollo progresivo hacia C2. No prometer C2 en un plazo fijo ni equivalencia oficial a partir de evaluaciones propias.

## Decisiones tomadas

- Interfaz en navegador y servicio local en la computadora de cada usuario.
- La experiencia completa, instrucciones, ayudas y retroalimentación estarán en inglés.
- El input comprensible guiará la selección de dificultad, contexto y ayudas. La producción y revisión serán parte del aprendizaje.
- La interacción debe sentirse entretenida sin imponer una temática de campus, profesión o mundo ficticio.
- Sin contratación de consumo de IA por tokens ni compra automática de créditos. Cada usuario autoriza su propio plan compatible y mantiene desactivado el uso de créditos adicionales.
- Motor de actividades, repaso, progreso y recompensas propio; GPT como tutor y apoyo a respuestas abiertas.
- Distinguir mensajes hablados de escritos: no atribuir al estudiante mayúsculas, puntuación u ortografía producidas por reconocimiento de voz.
- El estudiante controla cuándo termina y envía su intervención oral.
- Cuentas y progreso independientes por usuario. La solución central seleccionada es Supabase Auth con Google y PostgreSQL; configuración externa pendiente.
- El diagnóstico y las prioridades serán individuales. Enrique declara un nivel aproximado entre B1 y C1 y prioridad personal en Speaking; no es una medición ni el nivel objetivo de todos los usuarios.
- Disponibilidad flexible, sin cifra semanal comprometida. Se desea un alcance ambicioso con apoyo de IA; las estimaciones se ajustarán con evidencia de las primeras entregas.

## Arquitectura inicial

Computadora del usuario:

1. Interfaz de aprendizaje en el navegador.
2. Servicio local: autorización del plan, llamadas de tutoría, validación de mensajes y persistencia local.
3. Audio del navegador: reconocimiento y síntesis, con capacidades variables según navegador y voces instaladas/disponibles.
4. Motor de aprendizaje: actividades, intentos, resultados, repaso y selección de siguiente actividad.

Servicio compartido: Supabase, pendiente de configurar y validar:

1. Identidad y acceso a cuentas.
2. Sincronización del progreso y recuperación.
3. Catálogo de contenidos y sus versiones.

La inferencia de cada suscripción se inicia desde el entorno local de su titular; el backend compartido no reutiliza la suscripción de una persona para otros usuarios. La computadora del promotor no actúa como servidor de todos.

Stack seleccionado: React/TypeScript/Vite/Tailwind/shadcn/Motion; Node/Fastify; SQLite/Drizzle; Supabase; Zod/Vitest/Playwright. Pendientes técnicos: lanzamiento sencillo del servicio, actualización, renovación y protección de credenciales, autorización por usuario, base local, sincronización y conflictos, respaldo, cuotas de infraestructura y compatibilidad de audio. El laboratorio actual no es el backend de producción.

## Evidencia disponible

- Pruebas acotadas de tutoría con autenticación por suscripción y medición de latencia.
- Alta independiente mediante consentimiento oficial completada por el usuario.
- Conversación integrada con transcripción, respuesta del modelo y síntesis de voz: funcionamiento confirmado por el usuario.
- Guardado local del historial implementado. La seguridad y sincronización multiusuario aún no están validadas.
- Pruebas automáticas para streaming completo/incompleto, límites, control del origen hablado/escrito y grabación con parada manual.

No demostrado: resultados pedagógicos sostenidos, calidad de evaluación C2, pronunciación a partir de audio, funcionamiento en todos los navegadores, disponibilidad para muchos usuarios o duración garantizada de la cuota del plan.

## Diseño UX/UI: decisiones abiertas

Preferencias confirmadas por el usuario:

- Juego moderno y cuidado, sin aspecto infantil.
- Retos variados y progreso visible en las cuatro habilidades.
- Modo claro principal y modo oscuro opcional.
- Desarrollo individual.
- Documentación completa el 1 de diciembre de 2026, revisión el 2–3 y entrega académica provisional el 4. El desarrollo del producto puede continuar después, en nuevas versiones.

Referencia propuesta por el usuario: https://www.ets.org/toefl.html

Explorar su paleta como inspiración, con identidad y componentes propios. Colores exactos y accesibilidad pendientes de inspección visual; no extraer valores del texto de la página.

- Concretar la expresión visual del juego moderno y el equilibrio entre variedad y ruta sugerida.
- Uso de personajes, movimiento, sonido y recompensas, configurable para evitar fatiga.
- Elegir dos o tres referencias adicionales después de conocer preferencias.

Preparar dos direcciones visuales sobre el mismo recorrido para poder compararlas: inicio, actividad y retroalimentación/progreso. No escoger por una portada atractiva sin comprobar una sesión real.

## Entregas propuestas

| Entrega | Producto revisable | Criterio de aceptación inicial |
| --- | --- | --- |
| D1. Definición | Visión, acta, interesados, alcance, restricciones y riesgos | Metas y exclusiones explícitas; condiciones del curso recogidas |
| D2. Diseño de aprendizaje | Diagnóstico inicial, subhabilidades, actividades, ayudas y medición | Las cuatro habilidades tienen objetivos y evidencia; dificultad ajustable |
| D3. UX/UI | Dos alternativas visuales y prototipo del recorrido | El usuario puede iniciar, completar, recibir ayuda y continuar sin confusión |
| D4. Arquitectura | Decisiones técnicas, datos, seguridad, sincronización y estimaciones | Separación de identidad, aprendizaje e IA; coste y restricciones documentados |
| D5. Primera sesión funcional | Un recorrido pequeño con las cuatro habilidades, tutoría y guardado | Práctica completa en inglés, corrección adecuada a modalidad y recuperación del progreso |
| D6. Piloto y validación | Pruebas de usabilidad, calidad, persistencia, fallos y aprendizaje | Hallazgos registrados, defectos priorizados y limitaciones explícitas |
| D7. Entrega académica | Manuales, evidencias, aceptación y lecciones aprendidas | Trazabilidad entre necesidad, requisito, entregable y evidencia real |

Las entregas pueden solaparse y elaborarse progresivamente. Fechas y esfuerzo se estimarán al conocer disponibilidad, equipo y plazo académico.

## Reglas pedagógicas y de experiencia propuestas

- Las ayudas usan inglés sencillo, imágenes, ejemplos y contexto; no traducción obligatoria.
- Las recompensas distinguen esfuerzo de dominio. Los puntos no acreditan un nivel MCER.
- La dificultad depende de subhabilidades y resultados, no solo de una etiqueta global.
- La conversación prioriza comprender y responder; no corregir cada turno de forma mecánica.
- No mostrar como nota de pronunciación la confianza del reconocimiento de voz.
- Evaluaciones con material nuevo y seguimiento diferido para distinguir aprendizaje de memorización.
- Contenido generado necesita criterios de revisión antes de incorporarse al banco evaluativo.
- Accesibilidad: teclado, contraste, tamaños legibles, control del movimiento y del sonido.

## Documentación académica adaptada a PMBOK 7

Producir progresivamente: acta y justificación; interesados; alcance, EDT y diccionario; requisitos y trazabilidad; cronograma y costes; registros de riesgos, supuestos, cambios y decisiones; calidad y pruebas; informes de avance; aceptación y cierre. Son artefactos seleccionados para este proyecto, no una lista obligatoria universal del PMBOK.

Separar entregables técnicos de resultados de aprendizaje y beneficios. No documentar validaciones o aprobaciones como realizadas antes de disponer de evidencia.

## Información necesaria del usuario

- Preferencias visuales y de motivación: recibidas, recogidas en el brief de diseño.
- Fecha académica provisional: 4 de diciembre de 2026; rúbrica y exigencias institucionales pendientes.
- Trabajo individual y disponibilidad flexible confirmados; capacidad semanal aún no cuantificada.
- Nivel declarado de Enrique: B1–C1, con Speaking como prioridad percibida. Diagnóstico pendiente; duración preferida de sesión y meta/fecha de examen aún no fijadas, sin bloquear los bocetos.

## Siguiente paso

La base 0.1.0 y el expediente se describen en ../academico/00-indice-y-estado.md. Revisar el prototipo, validar nueva conexión y voz, comparar alternativas UX y continuar con los hitos corregidos. Las fechas planificadas son objetivos futuros; las reales y aprobaciones se registran cuando ocurren.

