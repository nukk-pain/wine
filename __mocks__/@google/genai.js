// __mocks__/@google/genai.js
const mockGenerateContent = jest.fn().mockResolvedValue({
  text: JSON.stringify({
    name: "Test Wine",
    producer: "Test Producer",
    vintage: 2020,
    region: "Test Region",
    country: "Test Country",
    grape_variety: "Test Grape",
    alcohol_content: "13.5%",
    volume: "750ml",
    wine_type: "Red",
    appellation: "Test Appellation",
    notes: "Test notes"
  })
});

const mockClassifyContent = jest.fn().mockResolvedValue({
  text: "wine_label"
});

class MockGoogleGenAI {
  constructor(config) {
    this.apiKey = config.apiKey;
  }

  get models() {
    return {
      generateContent: jest.fn().mockImplementation((params) => {
        // Return different responses based on the prompt content
        const prompt = params.contents?.[0]?.parts?.[0]?.text || '';
        
        if (prompt.includes('classify') || prompt.includes('wine_label')) {
          return mockClassifyContent();
        }
        
        return mockGenerateContent();
      })
    };
  }
}

module.exports = {
  GoogleGenAI: MockGoogleGenAI,
  mockGenerateContent,
  mockClassifyContent
};