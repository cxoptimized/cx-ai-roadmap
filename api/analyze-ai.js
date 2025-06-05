// Backend Code for AI Integration Tool (Vercel-compatible)

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Resend } = require('resend');
const { Configuration, OpenAIApi } = require('openai');

const resend = new Resend(process.env.RESEND_API_KEY);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  try {
    const { companyName, industry, existingSystems, painPoints, goals, email } = req.body;

    // Generate roadmap content via OpenAI
    const prompt = `Create an AI Integration Roadmap for a ${industry} company named ${companyName}.

Existing Systems: ${existingSystems}
Pain Points: ${painPoints}
Goals: ${goals}

The roadmap should include:
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

    // Create PDF with logo and branding
    const pdfFileName = `${companyName.replace(/\s+/g, '_')}_AI_Roadmap.pdf`;
    const pdfPath = `/tmp/${pdfFileName}`;
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Add your logo and styling
    doc.image(path.join(__dirname, './assets/fulllogo.jpg'), { width: 120 });
    doc.fontSize(20).fillColor('#6bd14b').text('CX Optimized – AI Integration Roadmap', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(roadmapText, { align: 'left', lineGap: 6 });

    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    // Email the PDF
    const fileContent = fs.readFileSync(pdfPath);

    await resend.emails.send({
      from: 'roadmap@cxoptimized.com',
      to: email,
      subject: 'Your AI Integration Roadmap from CX Optimized',
      html: `<p>Hello ${companyName},</p>
