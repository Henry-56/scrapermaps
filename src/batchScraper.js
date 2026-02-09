const fs = require('fs');
const path = require('path');
const { searchPlaces, getPlaceDetails } = require('./mapsClient');

// Configuration
const CITY = 'Huancayo';
const COUNTRY = 'PE';
const SECTORS = [
    'pollerías',
    'restaurantes',
    'ferreterías',
    'farmacias',
    'clínicas',
    'talleres',
    'hoteles',
    'colegios privados',
    'barberías'
];

// High yield sectors for scoring bonus
const HIGH_YIELD_SECTORS = ['clínicas', 'hoteles', 'colegios privados'];

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Scoring Logic
function calculateScore(details, sector) {
    let score = 0;
    const breakdown = [];

    // Rule 1: No Website (+40)
    // details.website might be undefined or null
    const hasWebsite = !!details.website;
    if (!hasWebsite) {
        score += 40;
        breakdown.push('No Website (+40)');
    }

    // Rule 2: Phone Available (+20)
    if (details.formatted_phone_number) {
        score += 20;
        breakdown.push('Has Phone (+20)');
    }

    // Rule 3: Rating >= 4 (+15)
    if (details.rating && details.rating >= 4) {
        score += 15;
        breakdown.push('High Rating (+15)');
    }

    // Rule 4: Reviews >= 50 (+15)
    if (details.user_ratings_total && details.user_ratings_total >= 50) {
        score += 15;
        breakdown.push('High Review Count (+15)');
    }

    // Rule 5: Sector Rentable (+10)
    if (HIGH_YIELD_SECTORS.includes(sector)) {
        score += 10;
        breakdown.push('High Yield Sector (+10)');
    }

    // Determine Priority
    let priority = 'low';
    if (score >= 70) priority = 'high';
    else if (score >= 40) priority = 'medium';

    return { score, priority, has_website: hasWebsite, breakdown };
}

async function processSector(sector) {
    const query = `${sector} en ${CITY}`;
    console.log(`\n--- Processing Sector: ${sector} ("${query}") ---`);

    let allBusinesses = [];
    let nextPageToken = null;
    let pageCount = 0;
    const MAX_PAGES = 3; // Keep limited for safety/cost, user can increase if needed.

    try {
        do {
            pageCount++;
            console.log(`  Fetching page ${pageCount}...`);

            if (pageCount > 1) await sleep(2000); // Wait for token

            const searchResponse = await searchPlaces(query, nextPageToken);

            if (searchResponse.status !== 'OK' && searchResponse.status !== 'ZERO_RESULTS') {
                console.error(`  Error searching ${sector}:`, searchResponse.status);
                break;
            }

            const results = searchResponse.results || [];
            console.log(`  Found ${results.length} results. Fetching details...`);

            for (const place of results) {
                // Fetch full details
                const details = await getPlaceDetails(place.place_id);

                if (details) {
                    // Calculate Score & Priority
                    const { score, priority, has_website, breakdown } = calculateScore(details, sector);

                    // Structure Data
                    const business = {
                        place_id: place.place_id,
                        name: details.name,
                        category: sector, // simpler to just use the search sector
                        address: details.formatted_address,
                        district: 'Huancayo', // Simplified, could parse address for districts like El Tambo
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
                        // breakdown: breakdown // Optional debugging field
                    };

                    allBusinesses.push(business);
                }
                await sleep(200); // Rate limit
            }

            nextPageToken = searchResponse.next_page_token;

        } while (nextPageToken && pageCount < MAX_PAGES);

        // Calculate Stats
        const stats = {
            total: allBusinesses.length,
            with_website: allBusinesses.filter(b => b.has_website).length,
            without_website: allBusinesses.filter(b => !b.has_website).length,
            with_phone: allBusinesses.filter(b => b.phone).length,
            high_rating: allBusinesses.filter(b => b.rating >= 4.5).length
        };

        // Final JSON Structure
        const output = {
            meta: {
                city: CITY,
                country: COUNTRY,
                sector: sector,
                search_query: query,
                source: "Google Maps Places API",
                collected_at: new Date().toISOString(),
                total_results: allBusinesses.length
            },
            stats: stats,
            businesses: allBusinesses
        };

        // Save to file
        // Saving directly to frontend/src/data for immediate visibility
        const filename = `${sector.replace(/\s+/g, '_').toLowerCase()}_huancayo.json`;
        // Ensure normalization (remove accents for filename if desired, but simple is fine)
        // Actually, simple replace might leave accents. Let's do a basic normalize.
        const cleanFilename = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const outputPath = path.join(__dirname, '../frontend/src/data', cleanFilename);

        // Ensure dir exists (it should, but just in case)
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
        console.log(`  Saved ${allBusinesses.length} records to ${cleanFilename}`);

    } catch (error) {
        console.error(`  Failed to process sector ${sector}:`, error.message);
    }
}

async function main() {
    console.log('Starting Batch Data Collection...');

    // You can comment out sectors to run only specific ones during testing
    for (const sector of SECTORS) {
        await processSector(sector);
        await sleep(1000); // Pause between sectors
    }

    console.log('\nBatch Collection Complete!');
}

main();
