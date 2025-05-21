import React, { useState } from "react";
import "./CustomSelect.css";

export default function CustomSelect({ value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="custom-select-wrapper">
            <div
                className="custom-select-selected"
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
            >
                {selectedOption.label}
                <span className="custom-select-arrow">▼</span>
            </div>

            {isOpen && (
                <ul className="custom-select-options">
                    {options.map((option) => (
                        <li
                            key={option.value}
                            className="custom-select-option"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            title={option.tooltip}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
