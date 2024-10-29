interface GenerateBlogOptions {
  style: string;
  tone: string;
  length: string;
  language: string;
  transcript: string;
}

export async function generateBlogPost(options: GenerateBlogOptions) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error('Failed to generate blog post');
  }

  const data = await response.json();
  return data.content;
}
