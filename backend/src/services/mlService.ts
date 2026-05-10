import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function processReport(reportData: any) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/process-report`, {
      raw_text: reportData.description,
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      has_media: reportData.images?.length > 0,
      hour_of_day: new Date().getHours(),
      has_children: reportData.hasChildren || false,
      has_elderly: reportData.hasElderly || false,
      has_disabled: reportData.hasDisabled || false
    }, { timeout: 10000 });

    return response.data;
  } catch (error: any) {
    console.error('ML service error:', error.message);
    // Fail gracefully — don't block the report submission
    return {
      detected_language: 'en',
      language_confidence: 0,
      translated_text: reportData.description,
      nlp_entities: {},
      priority: 'MEDIUM',  // safe default
      priority_confidence: 0
    };
  }
}

export async function scoreDamage(damageData: any) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/score-damage`, damageData, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      console.error('ML damage score error:', error.message);
      return null;
    }
}
