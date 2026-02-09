const axios = require('axios');
const config = require('./config');

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Searches for places using the Text Search API.
 * @param {string} query - The search query (e.g., "pollerías en Huancayo").
 * @param {string} [pageToken] - Token for the next page of results.
 * @returns {Promise<object>} - The API response data.
 */
async function searchPlaces(query, pageToken = null) {
    try {
        const params = {
            query,
            key: config.googleMapsApiKey,
            region: 'pe', // Bias results to Peru
        };

        if (pageToken) {
            params.pagetoken = pageToken;
            // When pagetoken is provided, 'query' is ignored by the API, but axios handles params merge.
            // Ideally, we just pass they key and pagetoken.
            delete params.query;
            delete params.region;
        }

        const response = await axios.get(`${BASE_URL}/textsearch/json`, { params });
        return response.data;
    } catch (error) {
        console.error('Error searching places:', error.message);
        throw error;
    }
}

/**
 * Retrieves detailed information for a specific place.
 * @param {string} placeId - The Google Place ID.
 * @returns {Promise<object>} - The structured place details.
 */
async function getPlaceDetails(placeId) {
    try {
        const fields = [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'opening_hours',
            'rating',
            'user_ratings_total',
            'geometry',
            'url', // Google Maps URL
            'website', // Business Website
        ].join(',');

        const params = {
            place_id: placeId,
            fields,
            key: config.googleMapsApiKey,
            language: 'es', // Spanish response
        };

        const response = await axios.get(`${BASE_URL}/details/json`, { params });
        return response.data.result;
    } catch (error) {
        console.error(`Error fetching details for placeId ${placeId}:`, error.message);
        return null; // Return null to allow processing other items even if one fails
    }
}

module.exports = {
    searchPlaces,
    getPlaceDetails,
};
