import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const {
      companyName,
      industry,
      existingSystems,
      painPoints,
      goals,
      email
    } = req.body;

    // Step 1: Generate Roadmap with OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `Create an AI Integration Roadmap for a ${industry} company named ${companyName}.

Existing Systems: ${existingSystems}
Pain Points: ${painPoints}
Goals: ${goals}

Include:
- Quick Wins
- Mid-Term Strategies
- Long-Term AI Opportunities
- Suggested Tools
- Expected ROI`;

    const aiResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const roadmapText = aiResponse.data.choices[0].message.content;

    // Step 2: Generate PDF in Memory
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(20).fillColor('#6bd14b').text('CX Optimized – AI Integration Roadmap', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('black').text(roadmapText, {
        align: 'left',
        lineGap: 6
      });

      doc.end();
    });

    // Step 3: Email PDF to User
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const mailOptions = {
      from: 'CX Optimized <no-reply@cxoptimized.com>',
      to: email,
      subject: 'Your AI Integration Roadmap',
      html: `<p>Hello <strong>${companyName}</strong>,</p>
             <p>Your customized AI roadmap is attached as a PDF.</p>
             <p>If you'd like to discuss it further, <a href="https://www.cxoptimized.com/contact">click here to contact us</a>.</p>`,
      attachments: [
        {
          filename: `${companyName.replace(/\s+/g, '_')}_AI_Roadmap.pdf`,
          content: pdfBuffer
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'PDF emailed successfully' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Failed to generate or send roadmap' });
  }
}
