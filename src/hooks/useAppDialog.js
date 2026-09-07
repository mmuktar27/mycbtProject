import { useState, useCallback } from 'react';

export function useAppDialog() {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: '',
    actionLabel: 'Close',
    onAction: null,
    showCancel: false,
    actionLoading: false
  });

  const showDialog = useCallback((type, title, message, details = '', actionLabel = 'Close', onAction = null, showCancel = false) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      details,
      actionLabel,
      onAction,
      showCancel,
      actionLoading: false
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDialogAction = useCallback(async () => {
    if (dialog.onAction) {
      setDialog((prev) => ({ ...prev, actionLoading: true }));
      await dialog.onAction();
      setDialog((prev) => ({ ...prev, actionLoading: false }));
    } else {
      closeDialog();
    }
  }, [dialog, closeDialog]);

  return { dialog, showDialog, closeDialog, handleDialogAction };
}