import '@testing-library/jest-dom/vitest';

// jsdom не реализует scrollIntoView — заглушаем, чтобы тесты ChatWindow не падали.
window.HTMLElement.prototype.scrollIntoView = () => {};
