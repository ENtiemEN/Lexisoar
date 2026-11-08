# Riesgos, supuestos, cambios y decisiones
Registro inicial 7/11/2026. Responsable de seguimiento: Enrique. Escalas cualitativas alto/medio/bajo, sin porcentajes inventados.

| ID | Riesgo | Prob./impacto | Respuesta / disparador |
|---|---|---|---|
| K01 | Cambia SIWC o cuota resulta insuficiente | Media/alto | Tutor opcional; practice offline; error sin pago; revalidar cambios |
| K02 | Confundir borrador con banco revisado | Alta/alto | Estado draft, revisión por tarea y evidencia de aprobación |
| K03 | ASR atribuye errores al alumno | Alta/alto | Source speech, transcript editable, no nota acústica |
| K04 | Fallo de sync o mezcla de usuarios | Media/alto | Owner/RLS, SQLite primero y pruebas con dos cuentas |
| K05 | Alcance supera plazo | Alta/alto | Congelar incremento 25/11; separar producto posterior |
| K06 | Pérdida de .local | Media/alto | Copia con servicio detenido; ensayar recuperación |
| K07 | Afirmar eficacia/C2 sin evidencia | Media/alto | Separar uso/dominio, piloto y material nuevo |
| K08 | Voz artificial o no disponible | Alta/medio | Selector futuro, replay/transcript, audio natural posterior |
| K09 | Credenciales/privacidad | Media/alto | DPAPI, no sync de secretos, loopback y control CSRF |
| K10 | Rúbrica del curso desconocida | Alta/medio | Expediente adaptable; confirmar formato antes de revisión final |

Supuestos: fecha provisional 4/12 aceptada como planificación; capacidad flexible aún no medida; Windows/Chrome; cada usuario tiene plan compatible si quiere tutor. Restricciones: no pagos extra autorizados ni claves API por consumo; contenido/UI en inglés; no compartir suscripciones.

## Cambios
| ID/fecha real | Cambio | Motivo/impacto | Estado |
|---|---|---|---|
| C01 7/11 | Cierre académico adelantado a 4/12, docs 1/12 | Corrección explícita del usuario; producto puede seguir | Aplicado al cronograma |
| C02 7/11 | Base nueva en 4180, laboratorio 4178 conservado | Separar evidencia previa e incremento | Implementado |
| C03 7/11 | Contenido inicial etiquetado draft | No falsificar 60 conjuntos revisados | Aplicado |
| C04 7/11 | SQLite con better-sqlite3/Drizzle estable | Driver node-sqlite ausente en versión estable elegida | Implementado |

Proceso: registrar solicitud → motivo → impacto en fecha/coste/requisitos → decisión del promotor → actualización → evidencia. No pedir aprobación repetida para cambios rutinarios ya dentro del alcance; sí registrar cambios sustanciales.

## Decisiones y defectos abiertos
D01: identidad Stride provisional, tono moderno no infantil, claro principal/periwinkle propio. D02: híbrido de retos y ruta sugerida; comparación visual con usuario pendiente. D03: progreso es esfuerzo, no nivel. D04: datos locales de invitado no se asignan automáticamente a Google.

DEF01: nuevo login/tutor/DPAPI requiere prueba con usuario real. DEF02: Supabase sin configurar; validar dos cuentas/RLS antes de declarar multiusuario aceptado. DEF03: sin renovación automática y sin restauración de backup guiada. DEF04: banco corto por plantillas, dificultad no calibrada. DEF05: auditoría accesible, errores de audio y prueba física de micrófono nueva pendiente. DEF06: diagnóstico/simulacros/adaptación no implementados.

Acciones antes de entrega: revisar requisitos del curso, completar piloto acotado, documentar resultados y decidir cuáles defectos bloquean aceptación. Nada de este registro implica que pruebas futuras ya ocurrieron.



Cambio 0.4 (8/11/2026): entrenamiento de vocabulario independiente; Home reparte acceso entre historias, práctica y palabras. Grammar posterior. Riesgos: bandas no calibradas, calidad de borradores, autoinforme y limitaciones de voz. [Controles y pendientes](12-incremento-0.4.md).


Cambio 0.5 (8/11/2026): Grammar independiente con 24 temas originales en borrador. Riesgos: variantes válidas incompletas, recuerdo autoinformado y transferencia no demostrada. [Controles y decisiones](13-incremento-0.5.md).
