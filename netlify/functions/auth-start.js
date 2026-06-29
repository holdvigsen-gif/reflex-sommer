exports.handler = async function(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = 'https://relaxreflexsommer.netlify.app/.netlify/functions/auth-callback';

  if (!clientId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GOOGLE_CLIENT_ID not configured' })
    };
  }

  const scope = 'https://www.googleapis.com/auth/calendar.readonly';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ url: authUrl })
  };
};
