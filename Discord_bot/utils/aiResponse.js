/**
 * Generate AI response using Gemini model
 * @param {string} userMessage - The user's message
 * @param {Object} model - The Gemini AI model instance
 * @param {string} systemPrompt - The system prompt with rules
 * @returns {Promise<string>} - The AI response
 */
async function generateAIResponse(userMessage, model, systemPrompt) {
  try {
    // Clean user message (remove mentions)
    const cleanedUserMessage = cleanUserMessage(userMessage);

    // Create the full prompt with context
    const fullPrompt = `${systemPrompt}\n\nUser message: ${cleanedUserMessage}`;

    // Generate response from AI
    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    // Clean and validate response
    const cleanedResponse = cleanResponse(aiResponse);

    return cleanedResponse;

  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Clean user message (remove mentions and extra whitespace)
 * @param {string} message - Raw user message
 * @returns {string} - Cleaned message
 */
function cleanUserMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Remove mentions (like <@123456789>)
  let cleaned = message.replace(/<@!?\d+>/g, '').trim();

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || 'hi';
}

/**
 * Clean and validate the AI response
 * @param {string} response - Raw AI response
 * @returns {string} - Cleaned response
 */
function cleanResponse(response) {
  if (!response || typeof response !== 'string') {
    return 'Sorry, I couldn\'t generate a proper response.';
  }

  // Trim whitespace
  let cleaned = response.trim();

  // Ensure response is not too long for Discord (2000 char limit)
  if (cleaned.length > 1900) {
    cleaned = cleaned.substring(0, 1900) + '...';
  }

  // Remove any potential harmful content markers
  cleaned = cleaned.replace(/\[HARMFUL\]|\[NSFW\]|\[INAPPROPRIATE\]/gi, '');

  return cleaned || 'Sorry, I couldn\'t cook this response.';
}

/**
 * Build system prompt from config
 * @param {Object} config - Configuration object with prompt and rules
 * @returns {string} - Complete system prompt
 */
function buildSystemPrompt(config) {
  let systemPrompt = config.prompt || 'You are imitating walter white.';

  if (config.rules && Array.isArray(config.rules)) {
    systemPrompt += '\n\nRules you must follow:\n';
    config.rules.forEach((rule, index) => {
      systemPrompt += `${index + 1}. ${rule}\n`;
    });
  }

  return systemPrompt;
}

module.exports = {
  generateAIResponse,
  cleanResponse,
  cleanUserMessage,
  buildSystemPrompt
};