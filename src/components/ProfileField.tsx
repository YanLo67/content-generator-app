import React from "react";

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string | string[];
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isTextArea?: boolean;
  placeholder?: string;
}

const ProfileField = ({
  label,
  value,
  onChange,
  name,
  isTextArea = false,
  placeholder = "",
}: ProfileFieldProps) => {
  const InputComponent = isTextArea ? "textarea" : "input";

  // La valeur affichée est la même : on gère les tableaux de chaînes
  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>
      <div className="mt-1">
        <InputComponent
          type="text"
          name={name}
          id={name}
          value={displayValue || ""}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border-gray-300 shadow-sm 
            placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
            sm:text-sm transition duration-150 ease-in-out
            px-3 py-2 
            ${isTextArea ? "resize-y" : ""}
          `}
          rows={isTextArea ? 4 : undefined} // Un peu plus de hauteur par défaut pour les textarea
        />
      </div>
    </div>
  );
};

export default ProfileField;
