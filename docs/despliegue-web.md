# LexiSoar 0.6 · Despliegue de la beta privada

Corrección del primer despliegue (8/11/2026): los logs reales mostraron `ERR_MODULE_NOT_FOUND` para `/var/task/server/app`, importado desde `api/web.js`. Los imports relativos del backend y compartidos ahora declaran extensión `.js`, compatible con el JavaScript ESM emitido. `npm run build` incluye `check:server`: compila con NodeNext y carga el gateway y una sesión SQLite en memoria mediante Node nativo, sin cargadores de desarrollo ni servidor. Corrección comprobada localmente con build y 94 pruebas; requiere subir el commit y verificar el nuevo deployment. No implica que el dominio ya esté reparado.

Estado: código y esquema preparados; Google, despliegue Vercel y prueba publicada pendientes. GPT remoto permanece deshabilitado hasta resolver el acceso oficial. No considerar completa la beta con IA mientras ese requisito siga pendiente.

## 1. Supabase (proyecto ya creado)

Proyecto: `oaugxeahyjesdfrdfzwy`, URL `https://oaugxeahyjesdfrdfzwy.supabase.co`.
Las migraciones de `supabase/migrations` están aplicadas. La lista de invitados se administra en `public.lexisoar_invites`; los correos reales se insertaron por MCP, no se guardan en el repositorio. Desactivar `enabled` revoca acceso a datos, aunque exista una sesión anterior. No activar registro anónimo.

En **Authentication → Hooks**, habilitar **Before User Created** con la función PostgreSQL `public.lexisoar_before_user_created`. Este paso es indispensable para impedir crear cuentas no invitadas; el gateway y RLS también comprueban la invitación en cada acceso. Deshabilitar el proveedor Email y mantener solo Google para esta beta.

## 2. Google Cloud y Supabase Auth

1. Crear/seleccionar un proyecto Google Cloud para LexiSoar. Configurar Google Auth Platform, nombre LexiSoar, correo de soporte propio y audiencia externa.
2. Usar únicamente `openid`, `email` y `profile`. Crear un cliente OAuth de tipo **Web application**.
3. Registrar esta **Authorized redirect URI** exactamente:
   `https://oaugxeahyjesdfrdfzwy.supabase.co/auth/v1/callback`
4. En **Supabase → Authentication → Sign In / Providers → Google**, activar Google e introducir Client ID y Client Secret directamente. No enviarlos al chat ni subirlos a GitHub. No desactivar comprobaciones de nonce.
5. Cuando exista el dominio Vercel, añadir su origen HTTPS en Google si la consola solicita Authorized JavaScript origins. En Supabase URL Configuration, establecer ese dominio como Site URL y permitir exactamente `https://DOMINIO/auth/google/callback`. No habilitar comodines amplios para producción.

La cuenta de Google identifica al alumno. No proporciona acceso a ChatGPT.

## 3. Vercel

Subir el repositorio y usar **Add New → Project → Import Git Repository**. Plan Hobby para esta beta personal. Framework Vite, Node 24, build `npm run build`, directorio `dist`. No ejecutar `npm start` como comando de build. `vercel.json` enruta `/api/*` y `/auth/*` a la función web.

Configurar estas variables **solo en el servidor**, sin prefijo `VITE_`:

| Variable | Valor |
|---|---|
| `APP_ORIGIN` | URL HTTPS definitiva de Vercel, sin barra final |
| `SUPABASE_URL` | URL del proyecto anterior |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable de Settings → API Keys |
| `SUPABASE_SECRET_KEY` | Clave secreta de servidor de Supabase; también admite service_role heredada. Nunca se entrega al navegador |
| `SESSION_ENCRYPTION_KEY` | 32 bytes aleatorios codificados en base64 |

Generar la última en tu terminal y copiar el resultado directamente a Vercel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

No guardar claves reales en `.env.example`. Rotar la clave de sesión cerrará las sesiones existentes. Usar variables Production para la URL estable; no compartir cookies o secretos con previews no confiables. Vercel puede asignar un dominio al primer despliegue; actualizar `APP_ORIGIN`, redirecciones y volver a desplegar antes de probar Google.

## 4. Datos y comportamiento

- PostgreSQL guarda una instantánea versionada por propietario en `lexisoar_workspaces`: eventos, capítulos, feedback, observaciones, Vocabulary, Grammar, sesiones y FSRS. Las claves del snapshot son los seis almacenes existentes, no credenciales. La copia SQLite en memoria vive solo durante una petición; no hay archivo persistente en Vercel ni sesión global en memoria.
- Las reglas existentes calculan y validan respuestas en servidor. Un commit CAS atómico confirma el snapshot completo; si otra petición lo cambió, devuelve 409. Las escrituras del navegador se serializan por pestaña. Esta estrategia reduce el riesgo de cambiar las reglas pedagógicas durante la migración, pero no está diseñada para historiales masivos: una posterior normalización por entidad será necesaria al crecer.
- Límites iniciales: snapshot hasta 20 MB, importación textual desde UI hasta 3 MB; los endpoints de respaldo están sujetos al límite de respuesta de Vercel. Para historiales que lo excedan hará falta exportación fragmentada antes de ampliar la beta. No prometer exportación ilimitada.
- Settings permite exportar texto e importar el respaldo versión 2 en una cuenta vacía. Repetir el mismo archivo no duplica datos. No fusiona una cuenta con trabajo existente. Materiales de catálogo se validan contra versiones conocidas; los resultados importados no se promueven a aciertos verificados. Se conservan calendarios y respuestas, y las notas del tutor como notas importadas, sin reconstruir evaluaciones oficiales. Grabaciones y credenciales se excluyen.
- Un guardado solo se anuncia cuando PostgreSQL lo confirma. Los borradores pendientes se guardan localmente por propietario y aparecen en Settings para descargar y recuperar manualmente; nunca se reenvían solicitudes antiguas automáticamente. La beta no es offline. Una captura interrumpida no se presenta como audio recuperado.
- Bucket `lexisoar-recordings` privado: 10 MB/archivo, 100 MB/usuario, lectura firmada de 60 segundos. Subida directa firmada a Storage, con reserva transaccional de cuota y comprobación de tamaño/tipo al finalizar. Las URL de subida duran dos horas: la reserva máxima de 10 MB se mantiene hasta 125 minutos, incluso tras borrar, para evitar eludir la cuota. El siguiente intento de subida limpia objetos borrados cuyo plazo ya venció. Settings permite borrar tanto capturas listas como reservas pendientes. Una grabación referenciada y luego borrada dejará de reproducirse.
- No hay sincronización automática entre el servicio local y la web. La importación es explícita. Los datos locales originales permanecen intactos.

## 5. GPT y validación final

No activar el OAuth dinámico local en el dominio remoto. La integración hospedada está cerrada por defecto y no se habilita mediante una variable ficticia. Tramitar el acceso oficial para aplicaciones remotamente alojadas; definir e implementar el adaptador de credenciales cuando OpenAI proporcione los requisitos correspondientes. Cada alumno necesita su cuenta elegible. No hay pago por consumo ni fallback.

Prueba manual publicada: login con ambos invitados; rechazo de un tercero; creación/recarga de las cuatro áreas; acceso desde otro dispositivo; cerrar sesión y cambiar de usuario; guardados concurrentes; subida, reproducción y borrado de audio; importación desde una cuenta vacía. Revisar logs de Functions sin registrar tokens, cookies ni respuestas completas del alumno. Probar GPT real por separado cuando esté autorizado; las pruebas simuladas no lo sustituyen.

Reversión: usar el deployment anterior en Vercel y deshabilitar acceso a la beta si cambia el formato de datos. No borrar tablas, bucket ni archivos locales. Exportar antes de una migración incompatible. Las migraciones aplicadas son aditivas; no ejecutar `supabase/schema.sql` como sustituto del esquema web.

Referencias: [Google con Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Auth hooks](https://supabase.com/docs/guides/auth/auth-hooks), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [límites de Functions](https://vercel.com/docs/functions/limitations), [uso de planes ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source).
