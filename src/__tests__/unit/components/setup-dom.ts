import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
})

global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator
global.location = dom.window.location
global.HTMLElement = dom.window.HTMLElement
global.HTMLInputElement = dom.window.HTMLInputElement
global.Element = dom.window.Element
global.NodeList = dom.window.NodeList
global.DOMParser = dom.window.DOMParser

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Add missing methods for @testing-library
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function() { return false }
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function() {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function() {}
}