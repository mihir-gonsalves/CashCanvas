// frontend/src/components/upload/CSVUploadDialog.tsx
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { Upload, CheckCircle } from '@mui/icons-material';

import { useUploadCSV } from '@/hooks/useUploadCSV';
import { getErrorMessage } from '@/utils/errors';

interface CSVUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

type Institution = 'discover' | 'schwab' | 'cashcanvas' | '';

const INSTITUTIONS: Array<{ value: Institution; label: string; description: string }> = [
  {
    value: 'discover',
    label: 'Discover',
    description: 'Discover credit card CSV export',
  },
  {
    value: 'schwab',
    label: 'Schwab Checking',
    description: 'Schwab checking account CSV export',
  },
  {
    value: 'cashcanvas',
    label: 'CashCanvas',
    description: 'CSV exported from this app',
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CSVUploadDialog({ open, onClose }: CSVUploadDialogProps) {
  const uploadMutation = useUploadCSV();

  const [institution, setInstitution] = useState<Institution>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setFileError('File must be a CSV (.csv)');
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !institution) return;

    uploadMutation.mutate(
      { institution, file: selectedFile },
      {
        onSuccess: () => {
          // Reset form and close dialog on success
          setTimeout(() => {
            handleClose();
          }, 10000); // Show success message briefly before closing
        },
      }
    );
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    onClose();
  };

  const isValid = institution && selectedFile && !fileError;
  const isSuccess = uploadMutation.isSuccess;

  return (
    <Dialog
      open={open}
      onClose={uploadMutation.isPending ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onExited: () => {
          setInstitution('');
          setSelectedFile(null);
          setFileError(null);
          uploadMutation.reset();
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 5,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 2.5,
          gap: 1.5,
          fontSize: '1.25rem',
          fontWeight: 500,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Upload fontSize="medium" />
        Upload CSV
      </DialogTitle>

      <DialogContent sx={{ my: 2, overflow: 'hidden' }}>
        {/* Success message */}
        {isSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: -2, borderRadius: 2.5 }}
          >
            Successfully imported {uploadMutation.data?.count} transactions from {uploadMutation.data?.institution}
          </Alert>
        )}

        {/* Error message */}
        {uploadMutation.isError && (
          <Alert severity="error" sx={{ mb: 1, borderRadius: 2.5 }}>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {getErrorMessage(uploadMutation.error)}
            </Box>
          </Alert>
        )}

        {!isSuccess && (
          <Box sx={{ display: 'flex', flexDirection: 'column', pt: 2, gap: 3 }}>
            {/* Institution selector */}
            <FormControl fullWidth>
              <InputLabel>Institution</InputLabel>
              <Select
                value={institution}
                label="Institution"
                onChange={(e) => setInstitution(e.target.value as Institution)}
                disabled={uploadMutation.isPending}
                sx={{ borderRadius: 2.5 }}
              >
                {INSTITUTIONS.map((inst) => (
                  <MenuItem key={inst.value} value={inst.value}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {inst.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {inst.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* File selector */}
            <Box>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploadMutation.isPending}
                style={{ display: 'none' }}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={uploadMutation.isPending}
                  sx={{
                    py: 2,
                    borderRadius: 2.5,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0e2238',
                      backgroundColor: 'rgba(31, 58, 95, 0.04)',
                    },
                  }}
                >
                  {selectedFile ? selectedFile.name : 'Choose CSV file...'}
                </Button>
              </label>
            </Box>

            {/* File info */}
            {selectedFile && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2.5,
                }}
              >
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                  Selected file
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            )}

            {/* Instructions */}
            <Box
              sx={{
                p: 2,
                backgroundColor: '#c4e2ff',
                border: '1px solid #b4d2f7',
                borderRadius: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#1f3a5f', fontSize: '0.85rem', fontWeight: 500, mb: 1 }}>
                Instructions
              </Typography>
              <Typography variant="body2" sx={{ color: '#1f3a5f', fontSize: '0.825rem' }}>
                1. Select the institution that matches your CSV file<br />
                2. Choose your CSV file (max 10MB)<br />
                3. Click "Upload" to import transactions
              </Typography>
            </Box>

            {/* Warning */}
            <Box
              sx={{
                p: 2,
                backgroundColor: '#fef3c7',
                border: '1px solid #f6e8b2',
                borderRadius: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 500, mb: 1 }}>
                Warning
              </Typography>
              <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.825rem' }}>
                Duplicate transactions will be created if you upload the same file multiple times.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1.5, borderTop: '1px solid #e2e8f0' }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={uploadMutation.isPending}
          sx={{
            px: 3,
            fontWeight: 600,
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#0e2238',
              backgroundColor: 'rgba(31, 58, 95, 0.04)',
            },
          }}
        >
          {isSuccess ? 'Close' : 'Cancel'}
        </Button>
        {!isSuccess && (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadMutation.isPending || !isValid}
            sx={{
              px: 2,
              borderRadius: 2.5,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#0e2238',
              },
              '&:disabled': {
                backgroundColor: '#e5e7eb',
                color: '#9ca3af',
              },
            }}
          >
            {uploadMutation.isPending ? (
              <CircularProgress size={20} sx={{ color: '#ffffff' }} />
            ) : (
              'Upload'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}