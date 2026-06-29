const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
      https.get(url, (res) => {
            let d = '';
                  res.on('data', c => d += c);
                        res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
                            }).on('error', reject);
                              });
                              }

                              exports.handler = async (event) => {
                                const headers = {
                                    'Access-Control-Allow-Origin': 'https://relaxreflexsommer.netlify.app',
                                        'Content-Type': 'application/json'
                                          };

                                            const { location, query } = event.queryStringParameters || {};
                                              const apiKey = process.env.GOOGLE_MAPS_API_KEY;

                                                if (!location) {
                                                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_location' }) };
                                                      }

                                                        try {
                                                            // Geocode location to lat/lng
                                                                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
                                                                    const geo = await get(geocodeUrl);

                                                                        if (!geo.results || geo.results.length === 0) {
                                                                              return { statusCode: 404, headers, body: JSON.stringify({ error: 'location_not_found' }) };
                                                                                  }

                                                                                      const { lat, lng } = geo.results[0].geometry.location;
                                                                                          const formattedAddress = geo.results[0].formatted_address;

                                                                                              // Search for kid-friendly activities nearby
                                                                                                  const searchQuery = query || 'things to do for kids activities';
                                                                                                      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=10000&key=${apiKey}`;
                                                                                                          const placesData = await get(placesUrl);
                                                                                                          
                                                                                                              const places = (placesData.results || []).slice(0, 8).map(p => ({
                                                                                                                    name: p.name,
                                                                                                                          address: p.formatted_address || p.vicinity,
                                                                                                                                rating: p.rating,
                                                                                                                                      types: p.types ? p.types.slice(0, 3) : [],
                                                                                                                                            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`,
                                                                                                                                                  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.name + ' ' + (p.formatted_address || ''))}&destination_place_id=${p.place_id}`
                                                                                                                                                      }));
                                                                                                                                                      
                                                                                                                                                          return {
                                                                                                                                                                statusCode: 200,
                                                                                                                                                                      headers,
                                                                                                                                                                            body: JSON.stringify({
                                                                                                                                                                                    location: formattedAddress,
                                                                                                                                                                                            lat,
                                                                                                                                                                                                    lng,
                                                                                                                                                                                                            places,
                                                                                                                                                                                                                    mapsLink: `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${lat},${lng},13z`
                                                                                                                                                                                                                          })
                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                } catch (err) {
                                                                                                                                                                                                                                    console.error('Places error:', err);
                                                                                                                                                                                                                                        return { statusCode: 500, headers, body: JSON.stringify({ error: 'places_error', message: err.message }) };
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                          };
