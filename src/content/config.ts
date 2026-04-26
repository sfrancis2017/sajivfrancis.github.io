import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    videoUrl: z.string().optional(), // YouTube/Vimeo embed URL for legacy project posts
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    legacy: z.boolean().default(false), // marks ported portfolio posts vs new editorial content

    // Publishing mode: blog-first (publish here, syndicate widely) vs.
    // venue-first (hold; submit to a tier-1 venue; republish later with
    // canonical pointing to venue)
    publishMode: z.enum(['blog-first', 'venue-first']).default('blog-first'),

    // For venue-first content
    venueName: z.string().optional(),
    venueUrl: z.string().url().optional(),
    venuePublishDate: z.coerce.date().optional(),
    embargoEnds: z.coerce.date().optional(),

    // Canonical URL — auto-set by build for blog-first; manually set
    // to the venue URL for venue-first republished content
    canonicalUrl: z.string().url().optional(),

    // Syndication targets (for blog-first or post-embargo venue-first)
    syndicateTo: z
      .array(z.enum(['medium', 'devto', 'hashnode', 'bluesky', 'linkedin']))
      .default([]),

    // Where the post has been syndicated (filled in by GitHub Action)
    syndicated: z
      .object({
        medium: z.string().url().optional(),
        devto: z.string().url().optional(),
        hashnode: z.string().url().optional(),
        bluesky: z.string().url().optional(),
      })
      .optional(),

    // Optional: link a blog post to a future formal paper it seeds
    priorArtFor: z.string().optional(),

    // For the venue-first paper itself, track its lifecycle
    formalPaperStatus: z
      .enum([
        'drafting',
        'submitted',
        'under_review',
        'revisions',
        'accepted',
        'published',
        'rejected',
      ])
      .optional(),
  }),
});

export const collections = { blog };
