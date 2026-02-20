import { HfInference } from '@huggingface/inference';

let hfClient = null;

export const getHfClient = () => {
  // Check if API key exists and is valid
  const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ HF_API_KEY or HUGGINGFACE_API_KEY is not set in environment variables');
    return null;
  }
  
  if (apiKey === 'hf_dummy_key_for_testing') {
    console.error('❌ HF_API_KEY is still set to dummy value');
    return null;
  }
  
  // Initialize client if not already done
  if (!hfClient) {
    try {
      hfClient = new HfInference(apiKey.trim());
      console.log('✅ HfInference client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize HfInference client:', error);
      return null;
    }
  }
  
  return hfClient;
};