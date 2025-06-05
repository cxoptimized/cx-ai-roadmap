import { Configuration, OpenAIApi } from 'openai';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { companyName, industry, existingSystems, painPoints, goals, email } = req.body;

  try {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    const prompt = `Create an AI Integration Roadmap for a ${industry} company named ${companyName}.\n\nExisting Systems: ${existingSystems}\nPain Points: ${painPoints}\nGoals: ${goals}\n\nInclude:\n- Quick Wins\n- Mid-Term Strategies\n- Long-Term AI Opportunities\n- Suggested Tools\n- Expected ROI`;

    const aiResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const roadmapText = aiResponse.data.choices[0].message.content;

    // Generate PDF
    const fileName = `${companyName.replace(/\s+/g, '_')}_AI_Roadmap.pdf`;
    const roadmapDir = path.join(process.cwd(), 'public', 'roadmaps');
    const filePath = path.join(roadmapDir, fileName);

    if (!fs.existsSync(roadmapDir)) fs.mkdirSync(roadmapDir, { recursive: true });

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(20).fillColor('#6bd14b').text('CX Optimized – AI Integration Roadmap', { align: 'center' });
    doc.moveDown().fontSize(12).fillColor('black').text(roadmapText, { align: 'left', lineGap: 6 });
    doc.end();

    // Send Email with Link
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const roadmapURL = `https://${req.headers.host}/roadmaps/${fileName}`;

    await transporter.sendMail({
      from: 'CX Optimized <no-reply@cxoptimized.com>',
      to: email,
      subject: 'Your AI Integration Roadmap',
      html: `<p>Hi ${companyName},</p><p>Your AI roadmap is ready. <a href="${roadmapURL}">Download here</a>.</p>`
    });

    res.status(200).json({ success: true, pdfUrl: roadmapURL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate roadmap' });
  }
}

