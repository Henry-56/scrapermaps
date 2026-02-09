# Explorador de Empresas - Huancayo

Este proyecto es una herramienta Full Stack para recolectar y visualizar información de empresas en Huancayo, Perú, utilizando la **Google Maps Places API**.

## Características

- **Backend (Node.js)**:
  - Scripts para búsqueda masiva por sectores (Pollerías, Farmacias, Ropa, etc.).
  - Algoritmo de **Scoring y Priorización** para identificar clientes potenciales (e.g., empresas sin página web).
  - "Deep Search" para categorías amplias como Venta de Ropa.

- **Frontend (Astro + React + Leaflet)**:
  - Mapa interactivo estilo Google Maps.
  - Filtrado por sectores.
  - Visualización de métricas (Sin Web, Rating, Contacto).
  - Optimizado para Mobile y Desktop.

## Estructura del Proyecto

- `src/`: Scripts del backend (`batchScraper.js`, `clothingScraper.js`).
- `frontend/`: Aplicación Astro.
- `frontend/src/data/`: Archivos JSON con la data recolectada.

## Requisitos

- Node.js (v18+)
- API Key de Google Maps (Places API)

## Instalación

1.  Clonar el repositorio.
2.  Instalar dependencias del root (Backend):
    ```bash
    npm install
    ```
3.  Instalar dependencias del frontend:
    ```bash
    cd frontend
    npm install
    ```
4.  Configurar variables de entorno:
    - Crear `config.js` o `.env` en la raíz con:
      ```
      GOOGLE_MAPS_API_KEY=TU_API_KEY
      ```

## Uso

### Recolectar Data (Backend)

Para ejecutar el scraper masivo:
```bash
node src/batchScraper.js
```

Para búsqueda profunda de ropa:
```bash
node src/clothingScraper.js
```

### Visualizar Mapa (Frontend)

```bash
cd frontend
npm run dev
```
Abrir [http://localhost:4321](http://localhost:4321) en el navegador.

## Data Incluida

El repositorio incluye data precargada de Huancayo para:
- Pollerías
- Restaurantes
- Ferreterías
- Farmacias
- Clínicas
- Talleres
- Hoteles
- Colegios Privados
- Barberías
- Venta de Ropa
