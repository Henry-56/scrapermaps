const fs = require('fs');
const path = require('path');
const { searchPlaces, getPlaceDetails } = require('./mapsClient');

// Helper to delay execution (respect API rate limits)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const query = process.argv[2] || 'pollerías en Huancayo'; // Get query from CLI args or default
    console.log(`Starting search for: "${query}"...`);

    let allResults = [];
    let nextPageToken = null;
    let pageCount = 0;
    const MAX_PAGES = 3; // Safety limit to avoid excessive API usage during testing

    try {
        do {
            pageCount++;
            console.log(`Fetching page ${pageCount}...`);

            if (pageCount > 1) {
                // Google requires a short delay before the next_page_token becomes valid
                console.log('Waiting for next page token to activate...');
                await sleep(2000);
            }

            const searchResponse = await searchPlaces(query, nextPageToken);

            if (searchResponse.status !== 'OK' && searchResponse.status !== 'ZERO_RESULTS') {
                console.error('API Error:', searchResponse.status, searchResponse.error_message);
                break;
            }

            const places = searchResponse.results || [];
            console.log(`Found ${places.length} places on page ${pageCount}. fetching details...`);

            for (const place of places) {
                // Fetch details for each place to get phone number, hours, etc.
                const details = await getPlaceDetails(place.place_id);

                if (details) {
                    // Filter to ensure it's in Huancayo (Text Search is good, but double check usually doesn't hurt, 
                    // though strict filtering might discard valid results near borders. 
                    // For now, rely on "Huancayo" in address or query bias).
                    if (details.formatted_address && details.formatted_address.includes('Huancayo')) {
                        allResults.push({
                            name: details.name,
                            address: details.formatted_address,
                            phone: details.formatted_phone_number || 'N/A',
                            rating: details.rating || 'N/A',
                            reviews: details.user_ratings_total || 0,
                            location: details.geometry.location,
                            maps_url: details.url,
                            opening_hours: details.opening_hours ? details.opening_hours.weekday_text : 'N/A'
                        });
                    }
                }
                // Small delay to be nice to the API rate limiter
                await sleep(200);
            }

            nextPageToken = searchResponse.next_page_token;

        } while (nextPageToken && pageCount < MAX_PAGES);

        console.log(`\nScan complete. Total businesses found: ${allResults.length}`);

        // Save to JSON
        const outputPath = path.join(__dirname, '../results.json');
        fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
        console.log(`Results saved to: ${outputPath}`);

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

main();
