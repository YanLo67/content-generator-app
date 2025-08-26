import React from "react";

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string | string[]; // La valeur peut être une chaîne ou un tableau de chaînes
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isTextArea?: boolean; // Le '?' signifie que cette prop est optionnelle
}

const ProfileField = ({
  label,
  value,
  onChange,
  name,
  isTextArea = false,
}: ProfileFieldProps) => {
  const InputComponent = isTextArea ? "textarea" : "input";

  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-500">
        {label}
      </label>
      <InputComponent
        type="text"
        name={name}
        id={name}
        value={displayValue || ""}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-1 py-1"
        rows={isTextArea ? 3 : undefined}
      />
    </div>
  );
};

export default ProfileField;
