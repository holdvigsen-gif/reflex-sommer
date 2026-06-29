exports.handler = async (event) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = 'https://relaxreflexsommer.netlify.app/.netlify/functions/auth-callback';
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
        const state = Math.random().toString(36).substring(2);

          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
              `client_id=${clientId}&` +
                  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                      `response_type=code&` +
                          `scope=${scope}&` +
                              `access_type=offline&` +
                                  `prompt=consent&` +
                                      `state=${state}`;

                                        return {
                                            statusCode: 302,
                                                headers: {
                                                      Location: authUrl,
                                                            'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
                                                                },
                                                                    body: ''
                                                                      };
                                                                      };
