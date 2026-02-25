/**
 * UploadQueueStatus Component - Stub for offline mode
 * Upload queue UI disabled for now
 */

import React from 'react';
import { View, Text, Modal } from 'react-native';

interface UploadQueueStatusProps {
  visible: boolean;
  onClose: () => void;
}

const UploadQueueStatus: React.FC<UploadQueueStatusProps> = ({ visible, onClose }) => {
  // Feature disabled - will enable later
  return null;
};

export default UploadQueueStatus;
