export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { recipeText, imageBase64, imageMediaType, style, lang, hostName } = req.body;
    const langName = { es: 'español rioplatense', en: 'inglés', pt: 'portugués brasileño' }[lang] || 'español';
    const hostLine = hostName ? `Tu nombre es ${hostName}.` : '';

    const styles = {
      podcast: `Narrá la receta en ${langName} de forma conversacional y natural. IMPORTANTE: usá ÚNICAMENTE los ingredientes, proporciones y técnica exacta que están en la receta. No agregues variaciones, historia ni proporciones distintas a las indicadas. Respetá exactamente lo que dice la receta.`,
      tecnico: `Sos instructor/a de una academia de bartending profesional. ${hostLine} Explicá la receta en ${langName} con precisión técnica: técnicas, proporciones, temperatura, dilución, garnish. Cada término se explica brevemente. Usá SOLO lo que dice la receta.`,
      historia: `Empezá con el origen histórico y cultural en ${langName}. ${hostLine} Contexto, época, curiosidades. Luego transicioná a la receta completa usando SOLO los ingredientes indicados.`,
      asmr: `Describí la receta de forma lenta y sensorial en ${langName}. ${hostLine} Texturas, aromas, sonidos, temperatura. Frases largas y pausadas. Usá SOLO lo que dice la receta.`
    };

    const systemPrompt = `Respondé ÚNICAMENTE con el script de audio listo para leer en voz alta, en ${langName}. Sin títulos, sin markdown, sin corchetes. Solo texto continuo narrado. Máximo 100 palabras. Usá SOLO la información de la receta proporcionada, sin agregar historia, metáforas ni contexto extra. Presentá los ingredientes y pasos de forma directa y clara. ${styles[style] || styles.podcast}`;

    let userContent;
    if (imageBase64) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: recipeText ? `Receta en imagen. Adicional: ${recipeText}. Generá el script.` : 'Esta es la receta. Generá el script de podcast.' }
      ];
    } else {
      userContent = `Receta: ${recipeText}\n\nGenerá el script.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const script = data.content.find(b => b.type === 'text')?.text || '';
    res.status(200).json({ script });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
