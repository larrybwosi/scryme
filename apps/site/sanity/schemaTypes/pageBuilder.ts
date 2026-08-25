import {defineArrayMember, defineField, defineType} from 'sanity'

const requiredText = (Rule: any) => Rule.required().min(2)

export const linkType = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: requiredText}),
    defineField({name: 'href', title: 'Destination', type: 'string', description: 'Use a site path such as /demo or a full https:// URL.', validation: (Rule) => Rule.required().custom((value) => !value || value.startsWith('/') || value.startsWith('https://') ? true : 'Use a relative path or secure URL')}),
    defineField({name: 'style', title: 'Style', type: 'string', initialValue: 'primary', options: {list: [{title: 'Primary', value: 'primary'}, {title: 'Secondary', value: 'secondary'}, {title: 'Text', value: 'text'}], layout: 'radio'}}),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})

export const accessibleImageType = defineType({
  name: 'accessibleImage',
  title: 'Accessible image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({name: 'alt', title: 'Alternative text', type: 'string', description: 'Describe the purpose of the image. Leave empty only when purely decorative.', validation: (Rule) => Rule.max(180)}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
})

const eyebrow = defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'})
const heading = defineField({name: 'heading', title: 'Heading', type: 'string', validation: requiredText})
const body = defineField({name: 'body', title: 'Body', type: 'text', rows: 4})
const visibility = defineField({name: 'hidden', title: 'Hide section', type: 'boolean', initialValue: false})

export const heroSectionType = defineType({
  name: 'heroSection', title: 'Hero', type: 'object',
  fields: [visibility, eyebrow, heading, body, defineField({name: 'primaryCta', title: 'Primary action', type: 'link'}), defineField({name: 'secondaryCta', title: 'Secondary action', type: 'link'}), defineField({name: 'image', title: 'Hero image', type: 'accessibleImage'}), defineField({name: 'variant', title: 'Layout', type: 'string', initialValue: 'split', options: {list: ['split', 'centered']}})],
  preview: {select: {title: 'heading', media: 'image'}, prepare: ({title, media}) => ({title: title || 'Hero', subtitle: 'Hero section', media})},
})

export const featureSectionType = defineType({
  name: 'featureSection', title: 'Feature grid', type: 'object',
  fields: [visibility, eyebrow, heading, body, defineField({name: 'items', title: 'Features', type: 'array', validation: (Rule) => Rule.max(8), of: [defineArrayMember({type: 'object', name: 'featureItem', fields: [defineField({name: 'title', type: 'string', validation: requiredText}), defineField({name: 'description', type: 'text'}), defineField({name: 'image', type: 'accessibleImage'}), defineField({name: 'link', type: 'link'})], preview: {select: {title: 'title', subtitle: 'description', media: 'image'}}})]})],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Feature grid', subtitle: 'Feature grid'})},
})

export const mediaSectionType = defineType({
  name: 'mediaSection', title: 'Media and content', type: 'object',
  fields: [visibility, eyebrow, heading, body, defineField({name: 'image', type: 'accessibleImage'}), defineField({name: 'imagePosition', title: 'Image position', type: 'string', initialValue: 'right', options: {list: ['left', 'right']}}), defineField({name: 'cta', title: 'Action', type: 'link'})],
  preview: {select: {title: 'heading', media: 'image'}, prepare: ({title, media}) => ({title: title || 'Media and content', subtitle: 'Split section', media})},
})

export const metricsSectionType = defineType({
  name: 'metricsSection', title: 'Metrics', type: 'object',
  fields: [visibility, heading, defineField({name: 'items', title: 'Metrics', type: 'array', validation: (Rule) => Rule.required().min(2).max(4), of: [defineArrayMember({type: 'object', name: 'metricItem', fields: [defineField({name: 'value', type: 'string', validation: requiredText}), defineField({name: 'label', type: 'string', validation: requiredText}), defineField({name: 'detail', type: 'string'})], preview: {select: {title: 'value', subtitle: 'label'}}})]})],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Metrics', subtitle: 'Proof points'})},
})

export const testimonialSectionType = defineType({
  name: 'testimonialSection', title: 'Testimonials', type: 'object',
  fields: [visibility, eyebrow, heading, defineField({name: 'items', title: 'Testimonials', type: 'array', validation: (Rule) => Rule.max(6), of: [defineArrayMember({type: 'object', name: 'testimonial', fields: [defineField({name: 'quote', type: 'text', validation: (Rule) => Rule.required().min(20)}), defineField({name: 'name', type: 'string', validation: requiredText}), defineField({name: 'role', type: 'string'}), defineField({name: 'company', type: 'string'}), defineField({name: 'portrait', type: 'accessibleImage'})], preview: {select: {title: 'name', subtitle: 'company', media: 'portrait'}}})]})],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Testimonials', subtitle: 'Customer proof'})},
})

export const faqSectionType = defineType({
  name: 'faqSection', title: 'FAQ', type: 'object',
  fields: [visibility, eyebrow, heading, body, defineField({name: 'items', title: 'Questions', type: 'array', validation: (Rule) => Rule.required().min(1), of: [defineArrayMember({type: 'object', name: 'faqItem', fields: [defineField({name: 'question', type: 'string', validation: requiredText}), defineField({name: 'answer', type: 'text', validation: requiredText})], preview: {select: {title: 'question', subtitle: 'answer'}}})]})],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Frequently asked questions', subtitle: 'FAQ'})},
})

export const ctaSectionType = defineType({
  name: 'ctaSection', title: 'Demo call to action', type: 'object',
  fields: [visibility, eyebrow, heading, body, defineField({name: 'primaryCta', title: 'Primary action', type: 'link'}), defineField({name: 'secondaryCta', title: 'Secondary action', type: 'link'})],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Book a demo', subtitle: 'Conversion section'})},
})

export const pageBuilderType = defineType({
  name: 'pageBuilder', title: 'Page sections', type: 'array',
  of: [defineArrayMember({type: 'heroSection'}), defineArrayMember({type: 'featureSection'}), defineArrayMember({type: 'mediaSection'}), defineArrayMember({type: 'metricsSection'}), defineArrayMember({type: 'testimonialSection'}), defineArrayMember({type: 'faqSection'}), defineArrayMember({type: 'ctaSection'})],
  options: {insertMenu: {views: [{name: 'list'}]}},
})
