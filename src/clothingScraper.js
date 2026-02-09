const fs = require('fs');
const path = require('path');
const { searchPlaces, getPlaceDetails } = require('./mapsClient');

// Configuration
const CITY = 'Huancayo';
const COUNTRY = 'PE'; // Fixed missing variable
const SECTOR_NAME = 'Venta de Ropa';
const OUTPUT_FILENAME = 'ropa_huancayo.json';

// Multiple queries to cast a wide net and bypass 60-result limit
const QUERIES = [
    'tiendas de ropa en Huancayo',
    'boutiques en Huancayo',
    'ropa de mujer en Huancayo',
    'ropa de hombre en Huancayo',
    'ropa de niños en Huancayo',
    'ropa deportiva en Huancayo',
    'camisetas en Huancayo',
    'jeans en Huancayo',
    'vestidos en Huancayo',
    'zapatillas en Huancayo',
    'zapaterías en Huancayo',
    'centros comerciales de ropa en Huancayo',
    'galerías de moda en Huancayo',
    'tiendas de ropa en El Tambo Huancayo',
    'tiendas de ropa en Chilca Huancayo',
    'mercado mayorista ropa Huancayo',
    'confecciones textiles Huancayo'
];

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Scoring Logic (Reused)
function calculateScore(details) {
    let score = 0;

    if (!details.website) score += 40;
    if (details.formatted_phone_number) score += 20;
    if (details.rating && details.rating >= 4) score += 15;
    if (details.user_ratings_total && details.user_ratings_total >= 50) score += 15;

    let priority = 'low';
    if (score >= 70) priority = 'high';
    else if (score >= 40) priority = 'medium';

    return { score, priority, has_website: !!details.website };
}

async function main() {
    console.log(`Starting Deep Search for: ${SECTOR_NAME} (Target: 500+)...`);

    const allBusinessesMap = new Map(); // Use Map to deduplicate by place_id

    for (const query of QUERIES) {
        console.log(`\n--- Running Query: "${query}" ---`);

        let nextPageToken = null;
        let pageCount = 0;
        const MAX_PAGES = 3;

        try {
            do {
                pageCount++;
                if (pageCount > 1) await sleep(2000);

                const searchResponse = await searchPlaces(query, nextPageToken);

                if (searchResponse.status !== 'OK' && searchResponse.status !== 'ZERO_RESULTS') {
                    console.error(`  Error searching "${query}":`, searchResponse.status);
                    break;
                }

                const results = searchResponse.results || [];
                console.log(`  Page ${pageCount}: Found ${results.length} results.`);

                for (const place of results) {
                    if (!allBusinessesMap.has(place.place_id)) {
                        // Store partially to fetch details later (optimizes if we hit limit)
                        // But for accuracy we need details. Let's fetch details immediately.
                        // Cost warning: 500 details = $$. Be careful. 
                        // Logic: Fetch details only if unique.

                        await sleep(100); // Rate limit
                        try {
                            const details = await getPlaceDetails(place.place_id);
                            if (details) {
                                const { score, priority, has_website } = calculateScore(details);

                                const business = {
                                    place_id: place.place_id,
                                    name: details.name,
                                    category: SECTOR_NAME,
                                    sub_category: query, // Track which query found it
                                    address: details.formatted_address,
                                    location: details.geometry.location,
                                    phone: details.formatted_phone_number || null,
                                    website: details.website || null,
                                    has_website: has_website,
                                    rating: details.rating || 0,
                                    reviews: details.user_ratings_total || 0,
                                    google_maps_url: details.url,
                                    business_status: details.business_status || 'OPERATIONAL',
                                    score: score,
                                    priority: priority,
                                    opening_hours: details.opening_hours ? details.opening_hours.weekday_text : 'N/A'
                                };

                                allBusinessesMap.set(place.place_id, business);
                                process.stdout.write(`+`); // Visual progress
                            }
                        } catch (err) {
                            console.error(`  Failed details for ${place.place_id}`);
                        }
                    } else {
                        process.stdout.write(`.`); // Duplicate
                    }
                }
                console.log(`\n  Total Unique So Far: ${allBusinessesMap.size}`);

                nextPageToken = searchResponse.next_page_token;

            } while (nextPageToken && pageCount < MAX_PAGES);

            // Intermediate Save
            const currentData = Array.from(allBusinessesMap.values());
            const tempOutput = {
                meta: {
                    city: CITY,
                    country: COUNTRY,
                    sector: SECTOR_NAME,
                    search_query: "IN_PROGRESS",
                    source: "Google Maps Places API",
                    collected_at: new Date().toISOString(),
                    total_results: currentData.length
                },
                stats: { total: currentData.length },
                businesses: currentData
            };
            fs.writeFileSync(path.join(__dirname, '../frontend/src/data', OUTPUT_FILENAME), JSON.stringify(tempOutput, null, 2), 'utf-8');

        } catch (error) {
            console.error(`  Query failed: ${error.message}`);
        }

        await sleep(1000);
    }

    // Convert Map to Array
    const allBusinesses = Array.from(allBusinessesMap.values());

    // Stats
    const stats = {
        total: allBusinesses.length,
        with_website: allBusinesses.filter(b => b.has_website).length,
        without_website: allBusinesses.filter(b => !b.has_website).length,
        with_phone: allBusinesses.filter(b => b.phone).length,
        high_rating: allBusinesses.filter(b => b.rating >= 4.5).length
    };

    const output = {
        meta: {
            city: CITY,
            country: COUNTRY,
            sector: SECTOR_NAME,
            search_query: "MULTIPLE (Deep Search)",
            source: "Google Maps Places API",
            collected_at: new Date().toISOString(),
            total_results: allBusinesses.length
        },
        stats: stats,
        businesses: allBusinesses
    };

    const outputPath = path.join(__dirname, '../frontend/src/data', OUTPUT_FILENAME);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n\nDeep Search Complete! Saved ${allBusinesses.length} unique records to ${OUTPUT_FILENAME}`);
}

main();
