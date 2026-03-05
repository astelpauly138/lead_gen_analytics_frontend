import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionBar = ({ selectedCount, onExport, onDelete, onClearSelection, isExporting, isDeleting }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => setShowConfirm(true);

  const handleConfirm = () => {
    setShowConfirm(false);
    onDelete();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-card border border-border rounded-xl shadow-lg px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-lg">
                <Icon name="CheckSquare" size={16} color="var(--color-primary)" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
              </span>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                iconName={isExporting ? null : "Download"}
                iconPosition="left"
                onClick={onExport}
                loading={isExporting}
                disabled={isExporting}
              >
                {isExporting ? 'Processing...' : 'Export'}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                iconName="Trash2"
                iconPosition="left"
                onClick={handleDeleteClick}
                loading={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>

              <button
                onClick={onClearSelection}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors touch-target"
                aria-label="Clear selection"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-center w-14 h-14 bg-error/10 rounded-full mx-auto mb-4">
              <Icon name="Trash2" size={24} color="var(--color-error)" />
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center mb-2">Delete Leads</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">{selectedCount} {selectedCount === 1 ? 'lead' : 'leads'}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionBar;
