import api from './axios';

/**
 * Upload an audio file and trigger Textalize transcription.
 * @param {File} file - The audio file to upload
 * @param {string} fileType - 'cx_call' | 'io_call' | 'frmu_call'
 * @param {object|null} ownerContext - Optional owner scope: { owner_type, owner_id }
 * @returns {Promise<object>} AudioFile record with status
 */
export const uploadAudio = async (file, fileType = 'cx_call', ownerContext = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  if (ownerContext?.owner_type) formData.append('owner_type', ownerContext.owner_type);
  if (ownerContext?.owner_id) formData.append('owner_id', ownerContext.owner_id);
  const { data } = await api.post('/transcription/upload/', formData);
  return data;
};

/**
 * Get the current status of an audio transcription.
 * @param {string} id - AudioFile UUID
 * @returns {Promise<object>} AudioFile record with nested transcription (if completed)
 */
export const getTranscriptionStatus = async (id) => {
  const { data } = await api.get(`/transcription/${id}/`);
  return data;
};

/**
 * List transcription audio files for a specific owner context.
 * @param {string} ownerType
 * @param {string} ownerId
 */
export const listTranscriptionAudio = async (ownerType, ownerId) => {
  const { data } = await api.get('/transcription/', {
    params: {
      owner_type: ownerType,
      owner_id: ownerId,
    },
  });
  return data;
};

/**
 * Delete a transcription audio file.
 * @param {string} id - AudioFile UUID
 */
export const deleteTranscriptionAudio = async (id) => {
  await api.delete(`/transcription/${id}/`);
};

/**
 * Translate a transcription to English using Gemini.
 * Returns cached translation if already generated.
 * @param {string} id - AudioFile UUID
 * @returns {Promise<{ translation_text: string, cached: boolean }>}
 */
export const translateTranscription = async (id) => {
  const { data } = await api.post(`/transcription/${id}/translate/`);
  return data;
};
