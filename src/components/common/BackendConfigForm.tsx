import React from 'react';

interface BackendConfigFormProps {
  title: string;
  buttonText: string;
  buttonColorClass: string; // e.g., 'blue-400', 'purple-400', 'red-400'
  connectionTypeOptions: string[];
  modelOptions?: string[]; // Optional for some backend configs
  additionalFields?: React.ReactNode; // For custom fields
}

const BackendConfigForm: React.FC<BackendConfigFormProps> = ({
  title,
  buttonText,
  buttonColorClass,
  connectionTypeOptions,
  modelOptions,
  additionalFields,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Backend Type</label>
          <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
            {connectionTypeOptions.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Connection URL</label>
          <input
            type="text"
            placeholder="https://your-backend.com/api"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
          />
        </div>
        {modelOptions && (
          <div>
            <label className="block text-sm font-medium mb-2">Model Selection</label>
            <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
              {modelOptions.map((option, idx) => (
                <option key={idx}>{option}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">API Key (Optional)</label>
          <input
            type="password"
            placeholder="Enter API key"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
          />
        </div>
        {additionalFields}
        <div className="col-span-2">
          <button
            className="w-full px-4 py-2 bg-green-600 rounded"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendConfigForm;