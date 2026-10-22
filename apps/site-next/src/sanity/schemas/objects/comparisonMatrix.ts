import { defineField, defineType } from 'sanity'

export const comparisonMatrixBlock = defineType({
  name: 'comparisonMatrixBlock',
  title: 'Comparison Matrix Table',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Feature-by-Feature Head-to-Head Comparison',
    }),
    defineField({
      name: 'description',
      title: 'Section Subtitle / Context',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'competitorName',
      title: 'Competitor Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'competitorLogo',
      title: 'Competitor Logo',
      type: 'image',
    }),
    defineField({
      name: 'scrymeBadge',
      title: 'Scryme Column Badge',
      type: 'string',
      initialValue: 'Winner • Next-Gen ERP',
    }),
    defineField({
      name: 'categories',
      title: 'Feature Categories',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'category',
          fields: [
            defineField({
              name: 'categoryName',
              title: 'Category Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'features',
              title: 'Features',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'featureRow',
                  fields: [
                    defineField({
                      name: 'featureName',
                      title: 'Feature Name',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'featureDescription',
                      title: 'Feature Details / Tooltip',
                      type: 'string',
                    }),
                    defineField({
                      name: 'scrymeSupport',
                      title: 'Scryme Support',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Full Support (Checkmark)', value: 'full' },
                          { title: 'Partial / Add-on', value: 'partial' },
                          { title: 'Not Supported (Cross)', value: 'none' },
                        ],
                      },
                      initialValue: 'full',
                    }),
                    defineField({
                      name: 'scrymeValueText',
                      title: 'Scryme Detail Note',
                      type: 'string',
                      description: 'e.g. "Native STK push built-in"',
                    }),
                    defineField({
                      name: 'competitorSupport',
                      title: 'Competitor Support',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Full Support (Checkmark)', value: 'full' },
                          { title: 'Partial / Add-on', value: 'partial' },
                          { title: 'Not Supported (Cross)', value: 'none' },
                        ],
                      },
                      initialValue: 'none',
                    }),
                    defineField({
                      name: 'competitorValueText',
                      title: 'Competitor Detail Note',
                      type: 'string',
                      description: 'e.g. "Third party add-on ($49/mo)"',
                    }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'verdictTitle',
      title: 'Bottom Verdict Header',
      type: 'string',
      initialValue: 'Why businesses choose Scryme over the competition',
    }),
    defineField({
      name: 'verdictText',
      title: 'Bottom Verdict Summary',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'competitorName',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Comparison Matrix',
        subtitle: subtitle ? `Vs ${subtitle}` : 'Comparison Matrix',
      }
    },
  },
})
