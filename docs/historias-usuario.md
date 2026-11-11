# Historias de usuario

Formato: *Como [rol], quiero [acción], para [beneficio]*, con sus criterios de aceptación.
Cubre HU-06 a HU-09 (Sprint 2 y Sprint 3). Las HU-01 a HU-05 (Sprint 1) se documentan en el
backlog original del equipo.

## HU-06 · Buscar y filtrar viajes disponibles

**Como** pasajero, **quiero** buscar y filtrar los viajes universitarios disponibles por destino
y punto de encuentro, **para** encontrar rápido uno que se ajuste a mi horario y mi ruta.

Criterios de aceptación:

- Solo se muestran viajes en estado `Programado` con cupo disponible.
- Filtros: destino (texto libre) y punto de encuentro del catálogo institucional.
- Orden: Horario, MenorAporte o Calificación.
- Paginación con botón «Ver más viajes».
- Sin resultados, la pantalla invita a publicar una ruta.

## HU-07 · Consultar detalle del viaje y apartar asiento

**Como** pasajero, **quiero** consultar el detalle de un viaje y apartar uno o dos asientos,
**para** asegurar mi lugar y conocer al conductor antes de confirmar.

Criterios de aceptación:

- Máximo 2 asientos por reserva, validado en cliente y en la API.
- La reserva se confirma automáticamente y genera un folio `KAR-UTTT-AAAA-XXXXXX`.
- Concurrencia optimista (`xmin`): si otro pasajero toma el último asiento, la API responde 409.
- El teléfono del conductor solo se entrega cuando la reserva queda confirmada.

## HU-08 · Mapa y confirmación de la reserva

**Como** pasajero con una reserva confirmada, **quiero** ver en un mapa el punto de encuentro,
la ruta y la ubicación del conductor, **para** saber exactamente dónde y cuándo abordar.

Criterios de aceptación:

- Mapa con Leaflet + OpenStreetMap; marcadores de punto de encuentro, destino y conductor.
- El conductor comparte su posición (`watchPosition`) cada 10 s o más; el pasajero la consulta
  cada 12 s mientras el viaje esté activo.
- Si la ubicación aún no está disponible (404), se muestra «Esperando al conductor».
- Distancia en línea recta (Haversine) y llegada estimada a 30 km/h.
- Funciona sin conexión: conserva la última ubicación conocida y las teselas en caché.

## HU-09 · Editar viaje publicado y avisar a pasajeros con reserva

**Como** conductor, **quiero** editar un viaje que ya publiqué (ruta, horario, asientos y gasto),
**para** corregir o ajustar los datos sin tener que cancelarlo y volver a publicarlo.

Criterios de aceptación:

- Editable solo por el dueño del viaje, y solo mientras está en `Borrador` o `Programado`.
- No se pueden ofrecer menos asientos que los ya reservados.
- Fecha de salida futura, con hasta 30 días de anticipación.
- Si hay reservas activas y cambia la fecha, hora, punto de encuentro, destino o ruta, se
  notifica automáticamente a los pasajeros con reserva.
- Cada edición queda registrada con sus valores anteriores y nuevos.

---

Responsables: Rocío Daniela García Jiménez (HU-06, HU-07, HU-08) · Arleth Cruz Hernández (HU-09).
Grupo 10-IDGS-G3, UTTT.
