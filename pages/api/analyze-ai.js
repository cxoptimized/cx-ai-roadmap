import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { companyName, industry, existingSystems, painPoints, goals, email } = req.body;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const prompt = `
      Create an AI Integration Roadmap for a ${industry} company named ${companyName}.

      Existing Systems: ${existingSystems}
      Pain Points: ${painPoints}
      Goals: ${goals}

      The roadmap should include:
      - Quick Wins
      - Mid-Term Strategies
      - Long-Term AI Opportunities
      - Suggested Tools
      - Expected ROI
    `;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const roadmap = response.data.choices[0].message.content;

    // Send PDF/Email code would go here in full production
    res.status(200).json({ roadmap });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
