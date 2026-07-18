import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: Record<string, any>;
}

export default function SEO({
  title = 'Banjara Bandhan - Matrimony',
  description = 'Connecting Souls of the Wandering Star — Premium Banjara Community Matrimony Platform',
  image = '/logo.jpg',
  url = 'https://www.banjarabandhan.in',
  type = 'website',
  structuredData
}: SEOProps) {
  const pageTitle = title === 'Banjara Bandhan - Matrimony' ? title : `${title} | Banjara Bandhan`;
  
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph tags for social sharing */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Banjara Bandhan" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO Tags */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
