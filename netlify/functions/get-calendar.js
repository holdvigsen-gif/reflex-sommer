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

function httpPost(url, data) {
    return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const body = new URLSearchParams(data).toString();
          const options = {
                  hostname: urlObj.hostname,
                  path: urlObj.pathname,
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
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

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(c => {
          const [k, ...v] = c.trim().split('=');
          cookies[k.trim()] = v.join('=');
    });
    return cookies;
}

exports.handler = async (event) => {
    const headers = {
          'Access-Control-Allow-Origin': 'https://relaxreflexsommer.netlify.app',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
          return { statusCode: 200, headers, body: '' };
    }

    const cookies = parseCookies(event.headers.cookie);
    let accessToken = cookies.access_token;
    const refreshToken = cookies.refresh_token;

    if (!accessToken && !refreshToken) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'not_authenticated' }) };
    }

    if (!accessToken && refreshToken) {
          const refreshed = await httpPost('https://oauth2.googleapis.com/token', {
                  refresh_token: refreshToken,
                  client_id: process.env.GOOGLE_CLIENT_ID,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET,
                  grant_type: 'refresh_token'
          });
          accessToken = refreshed.access_token;
          if (!accessToken) {
                  return { statusCode: 401, headers, body: JSON.stringify({ error: 'token_refresh_failed' }) };
          }
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
              start: e.start.dateTime || e.start.date,
              end: e.end.dateTime || e.end.date,
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
