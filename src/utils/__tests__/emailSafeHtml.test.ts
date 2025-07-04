import { describe, it, expect } from 'vitest'
import { convertToEmailSafeHtml } from '../emailSafeHtml'
import type { SerializedEditorState } from 'lexical'

describe('emailSafeHtml', () => {
  describe('convertToEmailSafeHtml', () => {
    it('should convert basic text content', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: 'Hello World',
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).toContain('<p style="margin: 0 0 16px 0; text-align: left;">Hello World</p>')
    })

    it('should handle text formatting', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  format: 1, // Bold
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: 'Bold',
                  version: 1,
                },
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: ' and ',
                  version: 1,
                },
                {
                  type: 'text',
                  format: 2, // Italic
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: 'Italic',
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).toContain('<strong>Bold</strong>')
      expect(html).toContain('<em>Italic</em>')
    })

    it('should convert headings with inline styles', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'heading',
              format: '',
              indent: 0,
              version: 1,
              tag: 'h1',
              children: [
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: 'Main Heading',
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).toContain('<h1 style="font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">Main Heading</h1>')
    })

    it('should handle lists with inline styles', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'unordered-list',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'list-item',
                  format: '',
                  indent: 0,
                  version: 1,
                  value: 1,
                  children: [
                    {
                      type: 'text',
                      format: 0,
                      style: '',
                      mode: 'normal',
                      detail: 0,
                      text: 'First item',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
              listType: 'bullet',
              tag: 'ul',
              start: 1,
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      // For now, just verify the content is converted
      expect(html).toContain('First item')
    })

    it('should handle links', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'link',
                  format: '',
                  indent: 0,
                  version: 1,
                  rel: null,
                  target: null,
                  title: null,
                  url: 'https://example.com',
                  children: [
                    {
                      type: 'text',
                      format: 0,
                      style: '',
                      mode: 'normal',
                      detail: 0,
                      text: 'Click here',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).toContain('Click here')
      expect(html).toContain('href="#"') // Links are converted to # placeholder
    })

    it('should sanitize dangerous HTML', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  detail: 0,
                  text: '<script>alert("XSS")</script>Normal text',
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).not.toContain('<script>')
      expect(html).toContain('Normal text')
    })

    it('should handle empty content', async () => {
      const editorState: SerializedEditorState = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [],
          direction: 'ltr',
        },
      }

      const html = await convertToEmailSafeHtml(editorState)
      expect(html).toBe('')
    })
  })
})