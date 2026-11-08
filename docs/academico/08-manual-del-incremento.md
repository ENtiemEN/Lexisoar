# Manual del incremento 0.1.0

**Histórico (7/11):** para la versión vigente 0.2 usa el recorrido de [capítulo inmersivo](10-incremento-0.2.md) y las instrucciones actualizadas del README. La biblioteca mantiene esta práctica anterior.
Fecha: 7/11/2026. Entorno objetivo Windows/Chrome. [Instalación y conexiones](../../README.md).

## Demostración reproducible
1. npm ci, npm run build y npm start. Abrir http://127.0.0.1:4180/.
2. Today: comprobar métricas reales iniciales. Elegir Reading → responder → Save response.
3. Listening: Play audio, elegir respuesta. Show transcript cuenta como ayuda.
4. Speaking: Play audio, Speak, hacer pausa, Stop, escuchar grabación y corregir errores del transcript. Guardar solo después de revisar. Si ASR no está disponible, grabar y escribir transcripción; no confundir esto con prueba de micrófono exitosa.
5. Writing: Build a Sentence o producción de email/discusión. Guardar, ver feedback y Revise & retry. Dos intentos permanecen en Portfolio.
6. Progress: verificar los intentos; recargar y comprobar persistencia.
7. Review: recordar significado, Reveal meaning y calificar Again/Hard/Good/Easy; fecha próxima persistida por FSRS.
8. Settings: oscuro/claro, exportar progreso. No contiene audio ni secretos.
9. Opcional: Connect ChatGPT, consentimiento propio; desactivar créditos de apps en proveedor, confirmar en UI, elegir modelo disponible y pedir tutoría. En transcript oral no corregir formato de ASR.
10. Opcional, solo con Supabase configurado: Google, sincronizar, volver a iniciar con otra cuenta y comprobar separación. Salir/reiniciar exige nuevo login Google.

## Fallos y límites
No abre: iniciar servicio, comprobar .local/server-error.log y puerto 4180; el laboratorio 4178 es otra aplicación. No voz: revisar permiso de micrófono, navegador y voces; la app no instala voces. Pausas no deben enviar; Stop controla fin, límite de seguridad cinco minutos.

Tutor falla: reconectar si sesión expira o esperar cuota; no se compra crédito ni se cambia a clave API. Sin configuración Google: práctica local disponible, sync no habilitado. Datos locales sin login son compartidos en esa cuenta Windows.

Independiente no equivale a simulacro TOEFL: no hay temporizador oficial, adaptación ni puntuación validada. Borradores no equivalen a conjuntos revisados. Autoescucha no es evaluación acústica. Puntos representan intentos, no nivel.

Conservación: detén servicio antes de copiar .local; guarda copia privada. No subir tokens/audio al repo. No se implementó aún importación guiada ni borrado selectivo de cuenta/grabación.


Manual adicional 0.3: [Progress, historial y análisis explícito](11-incremento-0.3.md), también resumido en README. Reiniciar el servicio tras actualizar para habilitar las rutas nuevas.


Manual 0.4: [Vocabulary independiente](12-incremento-0.4.md): Explore → My words → Train. El repaso anterior se conserva. Reiniciar el servicio después de actualizar; la sincronización remota de Vocabulary no está implementada.


Manual 0.5: [Grammar → Explore / Train / Review](13-incremento-0.5.md). Reiniciar el servicio tras actualizar. La ayuda GPT es explícita y el historial conserva las revisiones.


## Actualización 0.6 (8/11/2026)

La preparación de la beta web, cuentas privadas y evidencia actual se describe en [incremento 0.6](14-incremento-0.6.md). El [manual de despliegue](../despliegue-web.md) distingue implementación, comprobaciones SQL reales y validación publicada pendiente. Las secciones anteriores conservan su alcance histórico. No se considera aceptada la beta con IA hasta resolver Google/Vercel y GPT remoto autorizado.
