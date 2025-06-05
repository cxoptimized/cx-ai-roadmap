// Backend Code – API Route: /api/analyze-ai

const { Configuration, OpenAIApi } = require('openai');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Required for Vercel serverless
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { companyName, industry, existingSystems, painPoints, goals, email } = req.body;

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `
Create an AI Integration Roadmap for a ${industry} company called ${companyName}.

Existing Systems: ${existingSystems}
Pain Points: ${painPoints}
Goals: ${goals}

Include:
- Quick Wins
- Mid-Term Strategies
- Long-Term AI Opportunities
- Suggested Tools & Platforms
- Estimated ROI
    `;

    const aiResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const roadmapText = aiResponse.data.choices[0].message.content;

    // Generate PDF (in-memory stream)
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      // Email setup
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: 'CX Optimized <no-reply@cxoptimized.com>',
        to: email,
        subject: 'Your AI Integration Roadmap',
        html: `<p>Hello ${companyName},</p><p>Your customized AI roadmap is attached.</p>`,
        attachments: [
          {
            filename: `${companyName.replace(/\s+/g, '_')}_AI_Roadmap.pdf`,
            content: pdfData,
          },
        ],
      });

      res.status(200).json({ success: true, message: 'Email sent successfully' });
    });

    doc.fontSize(20).fillColor('#6bd14b').text('CX Optimized – AI Integration Roadmap', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(roadmapText, {
      align: 'left',
      lineGap: 6,
    });
    doc.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


