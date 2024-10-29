import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { style, tone, length, language, transcript } = await req.json();
    
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const prompt = `
      You are a professional blog writer. Your task is to create a well-structured, engaging blog post based SOLELY on the provided transcript.
      
      Content Guidelines:
      - Writing Style: ${style}
      - Tone: ${tone}
      - Target Length: ${length}
      - Language: ${language}
      
      Output Requirements:
      1. Create a compelling, SEO-friendly title using <h1>
      2. Write a brief, engaging introduction
      3. Organize content into logical sections with <h2> headings
      4. Use <p> tags for paragraphs
      5. Highlight key points using <strong> tags
      6. Include a conclusion section
      7. Maintain the specified tone and style throughout
      8. Focus only on information present in the transcript
      9. Add relevant quotes from the transcript when appropriate
      10. follow the target length as closely as possible
      
      HTML Structure:
      <article>
        <h1>[SEO-Optimized Title]</h1>
        
        <p>[Engaging introduction that hooks the reader]</p>
        
        <h2>[First Main Point]</h2>
        <p>[Detailed explanation with relevant information from transcript]</p>
        
        <h2>[Second Main Point]</h2>
        <p>[Supporting content with quotes where relevant]</p>
        
        <h2>Key Takeaways</h2>
        <p>[Summary of main points]</p>
      </article>

      Important:
      - Do not add any information not present in the transcript
      - Maintain factual accuracy
      - Use clear transitions between sections
      - Keep paragraphs concise and readable
      
      Transcript:
      ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ content: response.text() });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
