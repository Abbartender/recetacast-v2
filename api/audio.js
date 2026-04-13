export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    const voiceMap = {
      'pNInz6obpgDQGcFmaJgB': 'onyx',
      'EXAVITQu4vr4xnSDxMaL': 'nova',
      'VR6AewLTigWG4xSOukaG': 'fable',
      'ThT5KcBeYPX3keUQqHPh': 'shimmer'
    };

    const voice = voiceMap[voiceId] || 'onyx';

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Error OpenAI TTS ' + response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="episodio.mp3"');
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
