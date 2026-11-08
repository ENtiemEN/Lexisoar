# Incremento 0.4 · Vocabulary independiente

Registro del 8/11/2026. Expediente en elaboración: documentación completa el 1/12/2026, revisión 2–3/12 y entrega académica provisional el 4/12. No se declara cierre académico ni eficacia educativa demostrada.

## Producto entregable

Home ofrece tres caminos con igual jerarquía: Stories, Practice y Vocabulary. El capítulo de Mill Street permanece en Stories; Practice conserva los ejercicios independientes. Vocabulary no necesita capítulos, respuestas anteriores ni conexión GPT. Navegación principal Home/Practice/Vocabulary/Progress; el menú incluye Stories, Tutor y Settings. La URL antigua ?view=review abre el entrenador nuevo.

Vocabulary ofrece Train, Explore y My words. Explore busca por palabra/significado, filtra banda y tema y pagina diez entradas. My words permite selección, alta manual, colección de texto libre, archivo/restauración y edición de entradas personales. Las entradas del catálogo/legado conservan su contenido; otro significado se guarda como entrada personal nueva.

Catálogo: 120 significados, 30 por banda orientativa B1/B2/C1/C2. Definiciones y ejemplos originales, no copiados de bases de diccionarios. Cada entrada incluye categoría, definición en inglés, dos ejemplos, dos colocaciones, contexto con hueco, respuesta admitida y consigna de producción. Los temas son agrupaciones editoriales. Todas las entradas están marcadas **Draft · human review pending**; las bandas no están calibradas y no clasifican al usuario ni al TOEFL. La selección definitiva y la adecuación lingüística requieren revisión humana.

Las palabras personales requieren palabra, categoría, significado y al menos un ejemplo en inglés. El segundo ejemplo, colocaciones y contexto son opcionales. Una entrada sin contexto no genera ejercicio de huecos. La aplicación exige campos y estructura, pero no certifica automáticamente que el idioma de cada texto personal sea inglés.

## Manual de entrenamiento

1. Explore → Add to My words, o Add a word → completar significado/ejemplo → Save word.
2. Train → ajustar Review cards (20 por defecto, hasta 100) y New words (5 por defecto, hasta 30). No se añaden las 120 entradas a la cola automáticamente.
3. Start training: primero tarjetas vencidas por fecha, después significados seleccionados con alguna dirección aún no iniciada. Meet presenta significado, ejemplos y audio.
4. Recall meaning pide recuperar antes de revelar. Recall the word pide escribir la palabra desde su definición. Calificar Again/Hard/Good/Easy según el recuerdo propio. Again significa que no se pudo recordar; Hard requiere esfuerzo, Good esfuerzo normal y Easy recuerdo inmediato.
5. Complete the context comprueba respuestas admitidas sin GPT. Use it guarda una frase propia; puede omitirse. Los contextos se alternan entre sesiones y entradas, mientras que la producción es opcional para cada entrada.
6. Pause & exit confirma el guardado antes de salir. Resume training recupera borrador y posición. Finish this round termina antes si se desea, sin inventar resultados de tareas no contestadas.

El texto se autoguarda con un pequeño retardo y se confirma antes de avanzar, revelar, pausar o terminar. La etiqueta Saving… diferencia texto pendiente de Saved. Una recarga antes de confirmar puede activar la protección del navegador. Los conflictos entre pestañas no sobrescriben: recargar recupera la revisión confirmada. No se garantiza conservar escritura que nunca llegó a guardarse.

El navegador sintetiza palabra y ejemplos mediante voz inglesa si está disponible. Su calidad depende del dispositivo/proveedor; no se integra voz premium ni evaluación acústica. Pausar, salir o cambiar de tarea cancela la reproducción.

Al terminar, la pantalla muestra las próximas fechas de Vocabulary y las tarjetas ya vencidas. Volver a Vocabulary permite otra ronda si hay tarjetas vencidas o palabras seleccionadas por aprender. Explore y Practice permanecen accesibles fuera de una ronda; no se impone completar historias.

## Aprendizaje y medición

FSRS tiene una tarjeta por **entrada / significado / versión / dirección**. Significado y palabra poseen memorias separadas. Solo el primer recuerdo calificado de esa tarea programa FSRS; Meet, contexto y frase propia no crean tarjetas extra. Un fallo de palabra/contexto añade una práctica posterior en la misma ronda; conserva el fallo original y esa repetición no reprograma la misma tarjeta ni altera la primera exactitud.

La corrección local acepta únicamente las formas declaradas, normalizando mayúsculas, espacios y apóstrofes tipográficos. No se evalúa semánticamente una definición libre mediante coincidencia textual; el recuerdo de significado sigue siendo autoinforme. Una frase libre tampoco se convierte en un acierto objetivo.

Progress añade un bloque Vocabulary independiente, identificado como **all time**: entradas seleccionadas activas, tarjetas pendientes actuales, días de práctica UTC, numerador/denominador de palabra y contexto en primeros resultados, distribución autoinformada Again/Hard/Good/Easy y ejemplos propios con revisiones opcionales. No modifica las barras de Reading/Listening/Speaking/Writing. Las repeticiones posteriores de recuperación de una misma palabra, en otra sesión programada, son nuevos eventos de práctica, no una prueba global de dominio.

Los ejemplos se muestran en grupos ampliables de 20. Las calificaciones y días de este bloque corresponden al entrenador nuevo; el calendario del legado se conserva sin inventar resultados nuevos. El panel anterior de repaso puede seguir mostrando eventos antiguos de capítulo/biblioteca; no se fusionan estadísticas de unidades diferentes.

## IA opcional y seguridad

Una acción explícita y confirmación de uso exclusivo del plan habilitan dos solicitudes: proponer una entrada personal o revisar una frase. No se llama a GPT al abrir Home, Vocabulary, Explore, Train o Progress. No hay clave API ni cambio a un proveedor de pago. El usuario debe desactivar app credit use en ChatGPT; la aplicación no puede consultar esa preferencia.

Los borradores sugeridos se muestran editables y requieren Confirm & save word. El proveedor recibe solo palabra o entrada/significado/frase pertinentes, sin conversaciones ni historial ajeno. Las instrucciones consideran el contenido datos y piden JSON en inglés. La revisión devuelve uso del significado, un acierto observado y una mejora; no asigna puntuación oficial. En sesiones se utiliza la versión guardada del significado, aunque se edite la palabra en otra pestaña.

Los formatos inválidos, límites y desconexiones muestran error y conservan la edición local. Las solicitudes completadas tienen caché por identificador; reintentar el mismo identificador con contenido distinto se rechaza. Un resultado sugerido no se añade a My words sin confirmación. Las revisiones están separadas de los resultados objetivos.

## Arquitectura y compatibilidad

SQLite añade vocabulary_workspace, con registros JSON por propietario para selección, entradas personales, colecciones, sesiones, resultados, tarjetas y ayuda solicitada. No modifica eventos antiguos. Las transacciones locales guardan resultado y tarjeta conjuntamente; las sesiones usan revisión optimista y los resultados UUID idempotente. Cada sesión conserva las versiones completas del material utilizado.

| Interfaz local | Comportamiento |
|---|---|
| GET /api/vocabulary/catalog | search, level, topic y page; diez resultados |
| GET /api/vocabulary/entries | palabras, resumen y sesión pendiente del propietario |
| POST /api/vocabulary/entries | seleccionar catalogId o crear entry; collection |
| PATCH /api/vocabulary/entries | id/revision; editar entrada propia, archivar o cambiar colección |
| GET /api/vocabulary/sessions | recuperar sesión por id o última pendiente |
| POST /api/vocabulary/sessions | reviewLimit/newLimit; recuperar activa o crear una ronda |
| PATCH /api/vocabulary/sessions | id/revision, draft/revealed/status |
| POST /api/vocabulary/reviews | id, sessionId, revision, step, answer y rating cuando corresponda |
| POST /api/vocabulary/assist | id, action, datos pertinentes y planOnlyConfirmed; opcional contexto de sesión |

Las rutas heredan Host/Origin/CSRF y aislamiento por propietario. El modo local sigue siendo un espacio compartido de la cuenta Windows, no autenticación privada multiusuario. La base de aprendizaje no está cifrada; las credenciales mantienen DPAPI. No se creó servicio remoto ni migración en Supabase.

La compatibilidad del legado asigna un identificador propio a cada palabra con repaso previo, conserva su calendario de significado y origen. No se equipara al significado del catálogo por coincidencia de texto. Los repasos del capítulo se pueden entrenar aquí sin reabrirlo; los nuevos eventos antiguos de capítulo siguen actualizando su tarjeta de legado cuando sean más recientes.

Editar contenido personal crea una versión nueva con memoria nueva; las tarjetas/resultados previos permanecen en el respaldo y en las sesiones históricas. Archivo oculta de nuevas colas, conserva historial y permite restaurar. Una ronda ya iniciada conserva su material original.

GET /api/backup añade vocabulary al JSON versión 2, sin audio ni credenciales. Vocabulary no se sincroniza remotamente. Restauración desde el JSON sigue pendiente; para copia completa recuperable se conserva el procedimiento de detener el servicio y respaldar .local de forma privada.

## Fundamento y trazabilidad

[Nation, Word study strategies](https://www.cambridge.org/elt/resources/appliedlinguistics/vocabulary/LearningVocab_Sample_Ch8.pdf): contexto, colocaciones y recuperación receptiva/productiva. Aplicación: recuerdos separados y producción con situaciones propias.

[Revisión de entrenamiento de vocabulario L2](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/review-of-laboratory-studies-of-adult-second-language-vocabulary-training/18F0A5D1FFC829CE05931B2EEE83124A/share/9612bae4e131a6e3d9d0b0aacac044f5587eb6e0): práctica distribuida y recuperación; no se afirma un intervalo universal ni transferencia garantizada a fluidez.

[English Vocabulary Profile](https://englishprofile.org/?menu=english-vocabulary-profile): distinguir niveles de significados, no solo palabras. Solo referencia conceptual; no se distribuyen sus datos ni se atribuye validación de las bandas de este catálogo.

| Requisito | Evidencia técnica |
|---|---|
| Independencia y catálogo | Navegación y filtrado sin historia/GPT; 120 significados, huecos sin respuesta filtrada |
| Memorias separadas | Pruebas de dirección, versión, orden de vencimiento y no programación por contexto |
| Trabajo recuperable | Persistencia tras reapertura, borradores, pausa y conflicto de revisión |
| Integridad | Idempotencia, aislamiento, archivo/edición y respaldo |
| Compatibilidad | Eventos antiguos intactos y fechas exactas conservadas |
| Ayuda explícita | Consentimiento, caché, formato inválido y límite simulado sin pérdida |
| UI | Capturas escritorio/móvil, claro/oscuro, navegación y movimiento reducido |

Las pruebas de asistencia utilizan un proveedor simulado y no prueban por sí solas el comportamiento lingüístico de GPT real. Se conservan las verificaciones reales de conexión/feedback de incrementos anteriores sin atribuirlas a esta función nueva. Revisión humana del catálogo, pruebas con voz física y evaluación pedagógica longitudinal siguen pendientes. Grammar continúa fuera de este incremento.


Resultados técnicos: compilación TypeScript/Vite correcta; 50 pruebas Vitest y seis regresiones Node aprobadas. Las 28 pruebas Playwright de escritorio/móvil aprobaron el recorrido de capítulos, práctica, Progress y Vocabulary con datos/proveedor sintéticos. Capturas v04-* en output/verification. No se ejecutó una llamada real nueva de Vocabulary ni se alteró el servidor personal del usuario.


Se corrigió la carga inicial para esperar a la sesión local antes de solicitar datos. Una regresión con respuesta de sesión demorada verifica lectura y primer guardado en navegador nuevo, en escritorio y móvil.

