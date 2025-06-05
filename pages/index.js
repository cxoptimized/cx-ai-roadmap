import { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    existingSystems: '',
    painPoints: '',
    goals: '',
    email: '',
    optIn: false,
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Processing...');

    const res = await fetch('/api/analyze-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus(`Roadmap sent to your email!`);
    } else {
      setStatus('Error generating roadmap. Please try again.');
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI Integration Tool – CX Optimized</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="companyName" placeholder="Company Name" onChange={handleChange} required />
        <input name="industry" placeholder="Industry" onChange={handleChange} required />
        <textarea name="existingSystems" placeholder="Existing Systems" onChange={handleChange} required />
        <textarea name="painPoints" placeholder="Pain Points" onChange={handleChange} required />
        <textarea name="goals" placeholder="Goals" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
        <label>
          <input type="checkbox" name="optIn" onChange={handleChange} />
          I agree to receive updates.
        </label>
        <button type="submit">Generate AI Roadmap</button>
      </form>
      <p>{status}</p>
    </main>
  );
}
