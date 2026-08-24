import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Brand', default: true},
    {name: 'navigation', title: 'Navigation'},
    {name: 'conversion', title: 'Demo conversion'},
    {name: 'seo', title: 'SEO defaults'},
    {name: 'organization', title: 'Organization'},
  ],
  fields: [
    defineField({name: 'siteTitle', title: 'Site title', type: 'string', group: 'brand', validation: (Rule) => Rule.required()}),
    defineField({name: 'logo', title: 'Logo', type: 'accessibleImage', group: 'brand'}),
    defineField({name: 'announcement', title: 'Announcement', type: 'object', group: 'brand', fields: [defineField({name: 'enabled', type: 'boolean', initialValue: false}), defineField({name: 'text', type: 'string'}), defineField({name: 'link', type: 'link'})]}),
    defineField({name: 'primaryNavigation', title: 'Primary navigation', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'object', name: 'navigationItem', fields: [defineField({name: 'label', type: 'string', validation: (Rule) => Rule.required()}), defineField({name: 'href', type: 'string', validation: (Rule) => Rule.required()}), defineField({name: 'description', type: 'string'})], preview: {select: {title: 'label', subtitle: 'href'}}})]}),
    defineField({name: 'footerColumns', title: 'Footer columns', type: 'array', group: 'navigation', validation: (Rule) => Rule.max(5), of: [defineArrayMember({type: 'object', name: 'footerColumn', fields: [defineField({name: 'title', type: 'string', validation: (Rule) => Rule.required()}), defineField({name: 'links', type: 'array', of: [defineArrayMember({type: 'link'})]})], preview: {select: {title: 'title'}}})]}),
    defineField({name: 'demoCta', title: 'Global demo action', type: 'link', group: 'conversion', initialValue: {label: 'Book a demo', href: '/demo', style: 'primary'}}),
    defineField({name: 'demoSupportText', title: 'Demo support text', type: 'string', group: 'conversion', description: 'Short reassurance shown near high-intent demo actions.'}),
    defineField({name: 'contactEmail', title: 'Sales email', type: 'string', group: 'conversion', validation: (Rule) => Rule.email()}),
    defineField({name: 'siteDescription', title: 'Default site description', type: 'text', group: 'seo', validation: (Rule) => Rule.max(160)}),
    defineField({name: 'siteKeywords', title: 'Default site keywords', type: 'array', group: 'seo', of: [{type: 'string'}]}),
    defineField({name: 'defaultOgImage', title: 'Default social image', type: 'accessibleImage', group: 'seo'}),
    defineField({name: 'organizationName', title: 'Organization name', type: 'string', group: 'organization'}),
    defineField({name: 'organizationDescription', title: 'Organization description', type: 'text', group: 'organization'}),
    defineField({name: 'socialLinks', title: 'Social profiles', type: 'array', group: 'organization', of: [defineArrayMember({type: 'url'})]}),
  ],
  preview: {prepare: () => ({title: 'Site settings', subtitle: 'Brand, navigation, conversion and SEO'})},
})
