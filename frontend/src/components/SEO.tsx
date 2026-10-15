type SEOProps = {
    title: string
    description: string
    url?: string
    image?: string
    type?: 'website' | 'article'
    noindex?: boolean
}

const SITE_NAME = 'КтоКому'
const DEFAULT_IMAGE = '/og-image.png'

export function SEO({
    title,
    description,
    url,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
}: SEOProps) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

    const absoluteImage = image.startsWith('http')
        ? image
        : url
          ? new URL(image, url).href
          : undefined

    return (
        <>
            {/* Basic SEO */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            <meta
                name="robots"
                content={noindex ? 'noindex, nofollow' : 'index, follow'}
            />

            {/* Open Graph */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />

            {url && (
                <>
                    <meta property="og:url" content={url} />
                    <link rel="canonical" href={url} />
                </>
            )}

            {absoluteImage && (
                <meta property="og:image" content={absoluteImage} />
            )}

            {/* Twitter / X */}
            <meta
                name="twitter:card"
                content={absoluteImage ? 'summary_large_image' : 'summary'}
            />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />

            {absoluteImage && (
                <meta name="twitter:image" content={absoluteImage} />
            )}
        </>
    )
}
