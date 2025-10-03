export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    // 카카오맵 API 키
    const apiKey = process.env.KAKAO_MAP_API_KEY;
    
    if (!apiKey) {
      res.status(500).json({ error: 'API key not configured' });
      return;
    }

    // 카카오맵 Geocoder API 호출
    const kakaoUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&page=1&size=10`;
    
    const response = await fetch(kakaoUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
}
