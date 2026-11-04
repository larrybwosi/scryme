import { defineField, defineType } from 'sanity'

export const workflowStepsBlock = defineType({
  name: 'workflowStepsBlock',
  title: 'Workflow Steps Block',
  type: 'object',
  fields: [
    defineField({
      name: 'badge',
      title: 'Eyebrow Badge',
      type: 'string',
      initialValue: 'How It Works',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'steps',
      title: 'Workflow Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'stepNumber', title: 'Step Number (e.g. 01, Step 1)', type: 'string' }),
            defineField({ name: 'title', title: 'Step Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
            defineField({ name: 'icon', title: 'Icon Name (Lucide)', type: 'string' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      badge: 'badge',
    },
    prepare({ title, badge }) {
      return {
        title: title || 'Workflow Steps Block',
        subtitle: badge || 'Step-by-step process',
      }
    },
  },
})
