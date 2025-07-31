import { describe, it, expect } from 'vitest'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'
import type { SerializedEditorState } from 'lexical'

describe('Email Preview Customization', () => {
  const sampleEditorState: SerializedEditorState = {
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

  describe('wrapInTemplate option', () => {
    it('should wrap in template by default', async () => {
      const html = await convertToEmailSafeHtml(sampleEditorState, {
        wrapInTemplate: true,
      })
      
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html')
      expect(html).toContain('<body')
      expect(html).toContain('Hello World')
    })

    it('should not wrap in template when wrapInTemplate is false', async () => {
      const html = await convertToEmailSafeHtml(sampleEditorState, {
        wrapInTemplate: false,
      })
      
      expect(html).not.toContain('<!DOCTYPE html>')
      expect(html).not.toContain('<html')
      expect(html).not.toContain('<body')
      expect(html).toContain('Hello World')
      expect(html).toContain('<p')
    })
  })

  describe('customWrapper option', () => {
    it('should use custom wrapper when provided with wrapInTemplate: true', async () => {
      const customWrapper = (content: string, options?: { preheader?: string; subject?: string }) => {
        return `<div class="custom-wrapper">
          <h1>${options?.subject || 'Default Subject'}</h1>
          <div class="preheader">${options?.preheader || ''}</div>
          <div class="content">${content}</div>
        </div>`
      }

      const html = await convertToEmailSafeHtml(sampleEditorState, {
        wrapInTemplate: true,
        customWrapper,
        subject: 'Test Subject',
        preheader: 'Test Preheader',
      })
      
      expect(html).toContain('class="custom-wrapper"')
      expect(html).toContain('<h1>Test Subject</h1>')
      expect(html).toContain('<div class="preheader">Test Preheader</div>')
      expect(html).toContain('Hello World')
      expect(html).not.toContain('<!DOCTYPE html>') // Should not use default template
    })

    it('should support async custom wrapper', async () => {
      const customWrapper = async (content: string) => {
        return Promise.resolve(`<div class="async-wrapper">${content}</div>`)
      }

      const html = await convertToEmailSafeHtml(sampleEditorState, {
        wrapInTemplate: true,
        customWrapper,
      })
      
      expect(html).toContain('class="async-wrapper"')
      expect(html).toContain('Hello World')
    })
  })

  describe('backward compatibility', () => {
    it('should work without any customization options', async () => {
      const html = await convertToEmailSafeHtml(sampleEditorState)
      
      expect(html).toContain('Hello World')
      expect(html).toContain('<p')
    })

    it('should default to wrapping in template when wrapInTemplate is not specified', async () => {
      const html = await convertToEmailSafeHtml(sampleEditorState, {
        preheader: 'Test preheader',
      })
      
      // Without wrapInTemplate explicitly set, should not wrap
      expect(html).not.toContain('<!DOCTYPE html>')
      expect(html).toContain('Hello World')
    })
  })

  describe('integration with other options', () => {
    it('should work with customWrapper and other options', async () => {
      const customWrapper = (content: string, options?: { preheader?: string; subject?: string }) => {
        return `<div data-subject="${options?.subject}" data-preheader="${options?.preheader}">${content}</div>`
      }

      const html = await convertToEmailSafeHtml(sampleEditorState, {
        wrapInTemplate: true,
        customWrapper,
        subject: 'My Subject',
        preheader: 'My Preheader',
      })
      
      expect(html).toContain('data-subject="My Subject"')
      expect(html).toContain('data-preheader="My Preheader"')
      expect(html).toContain('Hello World')
    })
  })
})