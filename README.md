# ¿Cuál conviene? — Comparador de precios por unidad

Aplicación web interactiva para comparar qué producto conviene comprar según su precio y cantidad. Calcula el **precio por litro, kilo o unidad** de cada opción y resalta visualmente la más barata.

Ejemplo clásico: *¿Coca 1,35 L a $46 o Coca 1 L a $28?* La app responde al instante — $34,07/L contra $28/L — y marca la ganadora.

## Funcionalidades

- **Carga de productos**: nombre (opcional), precio y cantidad con su unidad (`ml`, `L`, `g`, `kg` o unidades). Acepta decimales con punto o coma (`1,35`).
- **Cálculo automático del precio por unidad**: convierte todo a la unidad base de su categoría (ml/L → precio por litro, g/kg → precio por kilo) y ordena de más barato a más caro.
- **Resaltado de la ganadora**: la mejor opción se marca en verde con un badge de "Mejor opción" y el porcentaje de ahorro respecto a la más cara.
- **Barras comparativas visuales**: cada producto muestra su precio relativo respecto al más caro de su categoría.
- **Comparación coherente**: los productos se agrupan por familia (líquidos, peso, unidades); nunca compara litros contra kilos.
- **Guardado automático**: la última comparación se persiste en `localStorage`, así al recargar o volver a abrir la página todo sigue como lo dejaste.
- **Eliminación individual o total** de productos, contador de productos y estado vacío con mensaje guía.
- **Validación de entrada**: campos inválidos se resaltan en rojo y no se agregan; los datos corruptos en `localStorage` se descartan sin romper la app.
- **Formateo local**: moneda en formato argentino (`es-AR`, ARS) y cantidades con hasta 3 decimales.
- **Accesibilidad y responsive**: etiquetas `aria`, animaciones que respetan `prefers-reduced-motion` y diseño adaptado a celular y escritorio.

## Estructura del proyecto

```
M_X_M/
├── frontend-web/
│   ├── index.html   # Estructura y diseño (Tailwind CSS por CDN)
│   └── app.js       # Toda la lógica interactiva
└── .gitignore
```

## Requisitos

- Un navegador moderno (Chrome, Edge, Firefox o Safari actualizados).
- **Conexión a internet**: la primera carga necesita acceso a los CDN de Tailwind CSS y Google Fonts (fuente Inter). No hay build, dependencias ni servidor: todo corre en el navegador.

## Cómo usarlo

1. Abrí `frontend-web/index.html` en tu navegador (doble clic basta).
2. Cargá al menos dos productos de la misma categoría (por ejemplo, dos bebidas en litros).
3. La comparación y el ganador aparecen automáticamente; cada cambio se guarda solo.

## Tecnologías

- **HTML5 + JavaScript (ES6+)**, sin frameworks ni pasos de compilación.
- **Tailwind CSS** vía CDN para el diseño.
- **Intl API** para formateo de moneda y cantidades.

## Futuras actualizaciones

- ✏️ **Edición de productos ya cargados** (hoy solo se pueden quitar).
- 🌙 **Modo oscuro**.
- 🔗 **Compartir comparaciones**: exportar como link o imagen.
- ⚖️ **Más unidades y monedas**: onzas, libras, y selector de moneda.
- 🛒 **Historial de comparaciones guardadas** y organización por tienda.
- 📱 **PWA**: instalación en el celular y funcionamiento offline completo (fuentes y estilos self-hosted).
- 🏷️ **Soporte para ofertas y descuentos** (ej.: precio con 2x1).

## Notas

- Todos los cálculos se hacen en el navegador; ningún dato sale del dispositivo.
- El `localStorage` usa la clave `cual-conviene:v1` (versionada, para poder migrar el formato en el futuro).
