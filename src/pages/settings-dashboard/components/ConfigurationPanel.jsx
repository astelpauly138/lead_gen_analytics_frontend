import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ConfigurationPanel = ({ title, icon, config, onTest, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [formData, setFormData] = useState(config);
  const [testResult, setTestResult] = useState(null);

  const handleToggleKey = (fieldName) => {
    setShowKeys(prev => ({ ...prev, [fieldName]: !prev?.[fieldName] }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTest = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection...' });
    
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestResult({
        status: success ? 'success' : 'error',
        message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.'
      });
    }, 1500);
  };

  const handleSave = () => {
    onSave?.(formData);
    setIsEditing(false);
    setTestResult({ status: 'success', message: 'Configuration saved successfully!' });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Icon name={icon} size={20} color="var(--color-primary)" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'default'}
          size="sm"
          iconName={isEditing ? 'X' : 'Edit2'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>
      <div className="space-y-4">
        {Object.entries(formData)?.map(([key, value]) => (
          <div key={key}>
            <Input
              label={key?.split('_')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))?.join(' ')}
              type={showKeys?.[key] ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleChange(key, e?.target?.value)}
              disabled={!isEditing}
              className="mb-2"
            />
            {key?.toLowerCase()?.includes('key') || key?.toLowerCase()?.includes('secret') ? (
              <button
                onClick={() => handleToggleKey(key)}
                className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Icon name={showKeys?.[key] ? 'EyeOff' : 'Eye'} size={14} />
                <span>{showKeys?.[key] ? 'Hide' : 'Show'} {key?.split('_')?.join(' ')}</span>
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {testResult && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          testResult?.status === 'success' ? 'bg-success/10 text-success' :
          testResult?.status === 'error'? 'bg-error/10 text-error' : 'bg-muted text-muted-foreground'
        }`}>
          <Icon 
            name={testResult?.status === 'success' ? 'CheckCircle2' : testResult?.status === 'error' ? 'XCircle' : 'Loader2'} 
            size={16}
            className={testResult?.status === 'testing' ? 'animate-spin' : ''}
          />
          <span className="text-sm">{testResult?.message}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          iconName="TestTube2"
          onClick={handleTest}
          disabled={!isEditing}
          className="flex-1"
        >
          Test Connection
        </Button>
        <Button
          variant="default"
          iconName="Save"
          onClick={handleSave}
          disabled={!isEditing}
          className="flex-1"
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;