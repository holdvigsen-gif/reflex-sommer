const https = require('https');

function post(url, data) {
  return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
          const body = new URLSearchParams(data).toString();
              const options = {
                    hostname: urlObj.hostname,
                          path: urlObj.pathname,
                                method: 'POST',
                                      headers: {
                                              'Content-Type': 'application/x-www-form-urlencoded',
                                                      'Content-Length': Buffer.byteLength(body)
                                                            }
                                                                };
                                                                    const req = https.request(options, (res) => {
                                                                          let d = '';
                                                                                res.on('data', c => d += c);
                                                                                      res.on('end', () => resolve(JSON.parse(d)));
                                                                                          });
                                                                                              req.on('error', reject);
                                                                                                  req.write(body);
                                                                                                      req.end();
                                                                                                        });
                                                                                                        }
                                                                                                        
                                                                                                        exports.handler = async (event) => {
                                                                                                          const { code, error } = event.queryStringParameters || {};
                                                                                                            const appUrl = 'https://relaxreflexsommer.netlify.app';
                                                                                                            
                                                                                                              if (error || !code) {
                                                                                                                  return { statusCode: 302, headers: { Location: appUrl + '?auth=error' }, body: '' };
                                                                                                                    }
                                                                                                                    
                                                                                                                      try {
                                                                                                                          const tokens = await post('https://oauth2.googleapis.com/token', {
                                                                                                                                code,
                                                                                                                                      client_id: process.env.GOOGLE_CLIENT_ID,
                                                                                                                                            client_secret: process.env.GOOGLE_CLIENT_SECRET,
                                                                                                                                                  redirect_uri: 'https://relaxreflexsommer.netlify.app/.netlify/functions/auth-callback',
                                                                                                                                                        grant_type: 'authorization_code'
                                                                                                                                                            });
                                                                                                                                                            
                                                                                                                                                                if (!tokens.access_token) {
                                                                                                                                                                      return { statusCode: 302, headers: { Location: appUrl + '?auth=error' }, body: '' };
                                                                                                                                                                          }
                                                                                                                                                                          
                                                                                                                                                                              const maxAge = tokens.expires_in || 3600;
                                                                                                                                                                                  const refreshCookie = tokens.refresh_token
                                                                                                                                                                                        ? `; refresh_token=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000; Path=/`
                                                                                                                                                                                              : '';
                                                                                                                                                                                              
                                                                                                                                                                                                  return {
                                                                                                                                                                                                        statusCode: 302,
                                                                                                                                                                                                              headers: {
                                                                                                                                                                                                                      Location: appUrl + '?auth=success',
                                                                                                                                                                                                                              'Set-Cookie': [
                                                                                                                                                                                                                                        `access_token=${tokens.access_token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`,
                                                                                                                                                                                                                                                  tokens.refresh_token ? `refresh_token=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000; Path=/` : null
                                                                                                                                                                                                                                                          ].filter(Boolean).join(', ')
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                      body: ''
                                                                                                                                                                                                                                                                          };
                                                                                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                                                                                console.error('Auth callback error:', err);
                                                                                                                                                                                                                                                                                    return { statusCode: 302, headers: { Location: appUrl + '?auth=error' }, body: '' };
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                      };
