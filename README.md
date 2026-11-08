# Stride · English in motion
Aplicación local con interfaz íntegramente en inglés. **0.5.0**: Grammar independiente; Vocabulary independiente y Home con tres caminos; Progress visual y accionable; capítulo inmersivo de cuatro habilidades, borradores recuperables, feedback contextual y reintentos. Biblioteca anterior con 60 actividades **en borrador**, FSRS y portafolio conservados. No es un curso C2 completo ni un simulador oficial.

## Abrir
Windows, Chrome y Node.js 24 o superior:

```powershell
npm ci
npm run build
npm start
```

Abre **http://127.0.0.1:4180/**. También puedes usar **Start Stride.cmd**: inicia el servicio oculto y abre el navegador; requiere dependencias instaladas. Compila si falta dist. Tras modificar código: vuelve a ejecutar npm run build. El laboratorio anterior permanece separado en 4178.

Desarrollo: npm run dev (interfaz 5173, servicio 4180). Verificar: npm run build, npm test, npm run test:e2e. Regresiones heredadas: node --test probes/auth-flow.test.mjs probes/recording.test.mjs probes/tutor-service.test.mjs. Ninguna prueba automática necesita gastar cuota de IA.

## Uso y conexiones
Inicio: elige Stories, Practice, Vocabulary o Grammar. En Stories: Step into the story → Begin chapter. Si hay una sesión en curso, Continue chapter; Start from the beginning abre una nueva sin borrar la anterior. El capítulo conecta Reading, Listening, Speaking, Writing y recuperación de tres palabras. Check response/Send response/Send email guarda el intento; Revise & retry conserva el anterior; Continue cambia de escena sin regresar al panel. Pause & exit guarda y permite retomar. El texto se autoguarda; durante un guardado pendiente no cierres el proceso del servidor.

Home, Practice, Vocabulary, Grammar y Progress están en la navegación principal; Stories, Tutor y Settings también están en el menú (avatar en móvil). El acceso antiguo Review abre Vocabulary → Train. La biblioteca conserva los doce formatos anteriores. Speaking: Speak → Stop → revisar transcript → Send response; grabación y reconocimiento terminan antes de enviar. El navegador puede usar reconocimiento remoto del proveedor. No es nota de pronunciación. Si cierras la pestaña durante una captura, ese audio no está garantizado; el texto ya confirmado sí puede recuperarse.

Para feedback automático de Speaking/Writing activa la opción del plan al empezar o en Chapter options. El consentimiento es por capítulo y exige créditos de apps desactivados por el titular; la app no puede consultar esa preferencia. Los ejercicios cerrados tienen corrección local. Un fallo del tutor conserva el intento y permite continuar. Chapter options también ofrece modelo, ayuda técnica y apariencia; pantalla completa es opcional en escritorio.

Settings → Connect ChatGPT autoriza tu propio plan en OpenAI. Se conserva la conexión ya comprobada por el usuario. Tokens protegidos con Windows DPAPI, fuera del navegador y de la nube compartida. Sin claves API ni fallback de pago. **Desactiva app credit use en ChatGPT**: la app no puede consultar esa preferencia. Aplican límites del plan. Ahora se intenta renovar el token caducado; si el proveedor exige autorización, reconecta desde Settings. No se extrajeron credenciales del laboratorio.

Modo local: un solo espacio compartido por quienes usen este servicio bajo la cuenta Windows. **No es un login privado multiusuario.** Google separa progreso por identidad verificada; tras reiniciar el servicio se debe iniciar sesión otra vez. El progreso local no se migra automáticamente a Google.

## Supabase opcional
No se creó ni modificó ningún proyecto remoto.

1. En un proyecto propio ejecuta supabase/schema.sql. Activa Google en Supabase Auth y configura OAuth siguiendo sus instrucciones.
2. En Supabase autoriza http://127.0.0.1:4180/auth/google/callback. En Google usa la URL de retorno de **Supabase**, no la del servicio local.
3. Define SUPABASE_URL y SUPABASE_ANON_KEY en el entorno del servicio. También puedes usar .env con: node --env-file=.env --import tsx server/index.ts. Nunca uses una clave service_role.
4. Reinicia; Settings → Continue with Google → Sync progress. Probar con dos cuentas antes de aceptar separación y recuperación remotas.

Sincronización manual en este incremento: eventos inmutables, RLS, UUID idempotente y descarga paginada. Guarda localmente antes de sincronizar. Fallar la nube no bloquea práctica. Grabaciones y credenciales nunca se sincronizan; respuestas y conversaciones sí se envían al proyecto al pulsar Sync. Las cuotas gratuitas no son ilimitadas.

## Datos, respaldo y parada
.local/stride.sqlite conserva progreso; .local/audio guarda grabaciones; .local/credentials contiene secretos DPAPI. La base de aprendizaje no está cifrada. Protege la cuenta Windows y sus copias.

Export text progress descarga JSON versión 2 con eventos, ejecuciones, feedback del capítulo y evaluaciones locales, más el espacio Vocabulary, **sin grabaciones ni secretos**; restauración desde JSON pendiente. Las ejecuciones y borradores del capítulo son locales, sin sync remoto en 0.5. Para respaldo recuperable completo: detener servicio y copiar .local a almacenamiento privado. DPAPI necesita el contexto Windows correspondiente; no subir .local a repositorios.

Para detener, identifica el proceso node cuyo comando contiene server/index.ts en el Administrador de tareas y ciérralo. La computadora solo debe estar encendida mientras se usa la aplicación. No cerrar procesos Node de otros proyectos.

## Documentación y límites
[Expediente y estado real](docs/academico/00-indice-y-estado.md). [Cronograma corregido](docs/planificacion/02-calendario-provisional.md). [Brief UX](docs/planificacion/01-brief-ux-ui.md).

Pendientes: contenido revisado/calibrado, diagnóstico, dos simulacros, adaptación y sync automático. Google/Supabase requieren configuración y validación de integración real. No se afirma puntuación oficial, dominio C2 ni eficacia educativa probada.

La conexión GPT fue confirmada por el usuario y el generador contextual se comprobó con una respuesta ficticia (5.757 s, un solo caso). Micrófono físico de 0.2, Supabase real y piloto pedagógico siguen pendientes. Ver [registro 0.2](docs/academico/10-incremento-0.2.md). Fuentes locales con licencia OFL en docs/licenses. Para la prueba real optativa: node --import tsx scripts/verify-feedback.ts; consume uso de tu plan y nunca utiliza conversaciones personales.


## Progress 0.3
Your next focus ofrece una acción; Your four skills muestra práctica; Your learning evidence separa aciertos objetivos y criterios del tutor. Selecciona habilidad y periodo (7/28/90 días o todo). Sin cinco primeras respuestas comparables por periodo aparece More evidence needed. Los resultados con ayuda y los reintentos no se mezclan con evidencia independiente.

Patterns to work on enlaza ejemplos y práctica. Remember & revisit distingue repasos pendientes y calificaciones autoinformadas. View history conserva respuestas, capítulos y grabaciones. Para categorizar feedback antiguo, selecciona las respuestas abiertas y confirma uso del plan: nunca se analiza automáticamente al abrir Progress. No hay nota TOEFL, MCER ni de pronunciación.

Después de actualizar: npm run build, detener tu servicio anterior con Ctrl+C y ejecutar npm start; recarga el navegador con Ctrl+F5. La ruta nueva requiere reiniciar el servicio. [Métricas, pruebas y límites 0.3](docs/academico/11-incremento-0.3.md).


## Vocabulary 0.4
Home ya no obliga a entrar en historias. Vocabulary tiene Train, Explore y My words; puedes usarlo sin GPT ni capítulos. Explore contiene 120 significados originales, 30 por banda orientativa B1–C2, con dos ejemplos y colocaciones. Son borradores pendientes de revisión humana; no equivalen a un nivel TOEFL ni a tu nivel personal.

Añade algunas entradas a My words o crea una palabra con significado y ejemplo en inglés. Train prepara hasta 20 tarjetas vencidas y cinco entradas nuevas por defecto. Descubre el significado, recuérdalo antes de revelar, recupera la palabra, completa contextos y guarda frases propias opcionales. Las dos direcciones de recuerdo tienen calendarios FSRS separados. Pause & exit guarda; Resume training recupera. Espera Saved antes de cerrar la pestaña.

GPT es opcional: prepara un borrador editable o revisa tu frase solo al solicitarlo y confirmar uso del plan. Abrir o repasar no genera llamadas. Los errores conservan tu trabajo; no hay fallback de pago. Los calendarios de palabras antiguas se conservan como legado, sin mezclarlas automáticamente con significados nuevos.

Progress muestra Vocabulary por separado, con resultados de palabra/contexto, autoinforme de recuerdo y ejemplos propios. El respaldo JSON incluye el nuevo espacio local; su sincronización remota y la restauración del JSON siguen pendientes. [Manual, métricas y verificación 0.4](docs/academico/12-incremento-0.4.md).

La interfaz ya compilada se abre tras reiniciar tu servicio: Ctrl+C, npm start y Ctrl+F5 en el navegador. Tras cambiar código, npm run build antes de iniciarlo. No es necesario volver a instalar dependencias para este incremento.


## Grammar 0.5
Grammar funciona sin historias, Vocabulary ni GPT. Explore tiene 24 temas originales, 48 objetivos y 288 ejercicios controlados; todo pendiente de revisión humana. Puedes seguir el orden sugerido o empezar por cualquier tema. La lección comienza con ejemplos contrastados; Train permite mezclar temas y Review recupera objetivos vencidos.

Meaning, Build, Transform y Repair usan corrección local con variantes declaradas. Los bloques se ordenan con botones o arrastrando. Hay frases ya válidas y escritura libre opcional sin calificación determinista. Pause & exit conserva texto, bloques y posición. FSRS se programa por objetivo/versión al introducirlo en una lección y en Review; Train y reintentos no alteran las tarjetas.

La ayuda GPT solo aparece al solicitarla y confirmar el plan: explicación alternativa o revisión de una producción escrita. Conserva el original, los borradores revisados y el final; cuota o formato inválido no bloquean práctica. Progress separa gramática de otras habilidades y respeta periodo/zona horaria. No se estima un nivel MCER ni una puntuación global.

El respaldo JSON incluye Grammar local, sin sincronización remota ni restauración JSON. [Manual, arquitectura y evidencia 0.5](docs/academico/13-incremento-0.5.md). Para probar la interfaz compilada: reinicia tu servicio con Ctrl+C y npm start; recarga con Ctrl+F5. No hace falta reinstalar dependencias.
