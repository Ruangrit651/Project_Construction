import React, { useState, useEffect, useRef } from "react";

//ฟังก์ชันสำหรับสร้าง Select Dropdown
const CustomSelect = ({
  options,
  placeholder,
  onChange,
  selectedOptions,
}: {
  options: string[];
  placeholder: string;
  onChange: (value: string[]) => void;
  selectedOptions: string[];
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (option: string) => {
    let updatedOptions: string[];
    if (option === "All") {
      updatedOptions = selectedOptions.includes("All") ? [] : [...options];
    } else {
      updatedOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((item) => item !== option)
        : [...selectedOptions.filter((item) => item !== "All"), option];
    }
    onChange(updatedOptions);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full border border-zinc-800 rounded p-2 mb-2">
      <div className="cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {selectedOptions.length > 0 ? selectedOptions.join(", ") : placeholder}
      </div>
      {isDropdownOpen && (
        <div className="absolute bg-white border rounded mt-2 w-full z-10">
          {options.map((option) => (
            <div key={option} className="flex items-center mb-2 p-2 hover:bg-teal-100 cursor-pointer">
              <input
                type="checkbox"
                id={option}
                name={option}
                value={option}
                checked={selectedOptions.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                className="mr-2"
              />
              <label htmlFor={option} className="text-lg">
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;