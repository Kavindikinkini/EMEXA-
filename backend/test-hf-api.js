/**
 * Test script to verify Hugging Face API key and model access
 * Run: node test-hf-api.js
 */

import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testHuggingFaceAPI = async () => {
  console.log('🧪 Testing Hugging Face API...\n');

  const apiKey = process.env.HF_API_KEY;
  
  if (!apiKey) {
    console.error('❌ HF_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  console.log('📏 API Key length:', apiKey.length);

  try {
    // Initialize HF client
    const hf = new HfInference(apiKey.trim());
    console.log('✅ HfInference client initialized\n');

    // Test 1: Simple text generation
    console.log('🧪 Test 1: Chat Completion with Qwen3-4B (Your Working Model)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const userMessage = `You are a helpful tutor. Provide a brief hint (1-2 sentences) for this quiz question. Guide the student without revealing the answer.

Question: What is photosynthesis?

Options:
1. Process of respiration
2. Process of converting light energy to chemical energy
3. Process of cell division
4. Process of digestion

Please provide a helpful hint:`;

    console.log('📝 Sending prompt...');
    
    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen3-4B-Instruct-2507',
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    console.log('✅ Response received!');
    console.log('📦 Raw response:', JSON.stringify(response, null, 2));
    console.log('\n💡 Generated hint:', response?.choices?.[0]?.message?.content || 'No text generated');

    // Test 2: Try alternative model
    console.log('\n🧪 Test 2: Text Generation with Alternative Model (GPT-2)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const simplePrompt = 'Hint for photosynthesis:';
    const response2 = await hf.textGeneration({
      model: 'gpt2',
      inputs: simplePrompt,
      parameters: {
        max_new_tokens: 50,
        temperature: 0.7
      }
    });

    console.log('✅ Response received!');
    console.log('📦 Raw response:', JSON.stringify(response2, null, 2));

    console.log('\n✅ All tests passed! Your API key is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing Hugging Face API:');
    console.error('Error message:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Verify your API key at: https://huggingface.co/settings/tokens');
      console.log('2. Make sure the token has "Make calls to the serverless Inference API" permission');
      console.log('3. Check if your token is active and not expired');
    } else if (error.message.includes('model') || error.message.includes('404')) {
      console.log('\n💡 Model not accessible. Try these steps:');
      console.log('1. Visit the model page: https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2');
      console.log('2. Accept any terms of use if prompted');
      console.log('3. Try with a different model like "gpt2" or "google/flan-t5-base"');
    }
  }
};

// Run the test
testHuggingFaceAPI();
