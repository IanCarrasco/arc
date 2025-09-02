import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const arxivId = searchParams.get('id');

  console.log('arXiv API called with ID:', arxivId);

  if (!arxivId) {
    console.log('No arXiv ID provided');
    return NextResponse.json({ error: 'arXiv ID is required' }, { status: 400 });
  }

  try {
    // Validate arXiv ID format
    const arxivIdPattern = /^\d{4}\.\d{4,5}(?:v\d+)?$/;
    if (!arxivIdPattern.test(arxivId)) {
      console.log('Invalid arXiv ID format:', arxivId);
      return NextResponse.json({ error: 'Invalid arXiv ID format' }, { status: 400 });
    }

    console.log('Valid arXiv ID format, proceeding with fetch');

    // Fetch the arXiv page
    const arxivUrl = `https://arxiv.org/abs/${arxivId}`;
    const response = await fetch(arxivUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AcademicBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch arXiv page: ${response.status}`);
    }

    const html = await response.text();

    // Parse the HTML to extract metadata
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';
    console.log('Extracted title:', title);

    // Extract authors - look for the authors section
    const authorsMatch = html.match(/<div class="authors"[^>]*>(.*?)<\/div>/);
    let authors: string[] = [];

    if (authorsMatch) {
      const authorsHtml = authorsMatch[1];
      const authorLinks = authorsHtml.match(/<a[^>]*>([^<]+)<\/a>/g);
      if (authorLinks) {
        authors = authorLinks.map(link => {
          const match = link.match(/<a[^>]*>([^<]+)<\/a>/);
          return match ? match[1].trim() : '';
        }).filter(author => author.length > 0);
      }
    }
    console.log('Extracted authors:', authors);

    // Extract abstract
    const abstractMatch = html.match(/<blockquote class="abstract mathjax"[^>]*>\s*<span class="descriptor">Abstract:<\/span>\s*(.*?)\s*<\/blockquote>/);
    let abstract = '';

    if (abstractMatch) {
      abstract = abstractMatch[1]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }
    console.log('Extracted abstract:', abstract.substring(0, 100) + '...');

    const result = {
      title,
      authors,
      abstract,
      arxivId,
      url: arxivUrl,
    };

    console.log('Returning result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching arXiv metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arXiv metadata' },
      { status: 500 }
    );
  }
}
