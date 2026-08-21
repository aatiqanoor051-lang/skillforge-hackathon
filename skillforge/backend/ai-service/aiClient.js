const OpenAI = require('openai');

/**
 * aiClient.js
 * Thin wrapper around an OpenAI-compatible SDK client. Provider,
 * base URL, model, and credentials all come from environment
 * variables so alternate OpenAI-compatible providers can be swapped
 * in without code changes.
 *
 * When AI_API_KEY is not configured, isAiConfigured() returns false
 * and callers must use their deterministic fallback path instead of
 * calling the network.
 */

let client = null;

function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0);
}

function getClient() {
  if (!isAiConfigured()) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    });
  }
  return client;
}

async function chatComplete({ messages, temperature, maxTokens, responseFormatJson = false }) {
  const openaiClient = getClient();
  if (!openaiClient) {
    throw new Error('AI provider is not configured (AI_API_KEY missing).');
  }
  const completion = await openaiClient.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: temperature ?? parseFloat(process.env.AI_TEMPERATURE || '0.4'),
    max_tokens: maxTokens ?? parseInt(process.env.AI_MAX_TOKENS || '1800', 10),
    ...(responseFormatJson ? { response_format: { type: 'json_object' } } : {}),
  });
  return completion.choices?.[0]?.message?.content || '';
}

module.exports = { isAiConfigured, getClient, chatComplete };
