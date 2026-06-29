const https = require('https');

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    };
    https.get(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Read token from query string (passed from frontend localStorage)
  const accessToken = (event.queryStringParameters || {}).token;

  if (!accessToken) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'not_authenticated' }) };
  }

  try {
    const calList = await httpGet('https://www.googleapis.com/calendar/v3/users/me/calendarList', accessToken);
    const targetCal = (calList.items || []).find(c => c.summary && c.summary.toLowerCase().includes('ludvig'));
    const calId = targetCal ? encodeURIComponent(targetCal.id) : 'primary';

    const now = new Date().toISOString();
    const later = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(later)}&singleEvents=true&orderBy=startTime&maxResults=25`;

    const eventsData = await httpGet(eventsUrl, accessToken);

    const events = (eventsData.items || []).map(e => ({
      id: e.id,
      title: e.summary || 'Ingen tittel',
      start: e.start,
      end: e.end,
      location: e.location || null,
      description: e.description || null,
      allDay: !e.start.dateTime
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events, calendarName: targetCal ? targetCal.summary : 'Primær kalender' })
    };
  } catch (err) {
    console.error('Calendar error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'calendar_error', message: err.message }) };
  }
};
