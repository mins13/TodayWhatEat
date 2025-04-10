import React, { useState } from "react";
import "./MemoPad.css";

function MemoPad() {
    const [memo, setMemo] = useState("");

    const handleChange = (e) => {
        setMemo(e.target.value);
    };

    return (
        <div className="memo-pad-container">
            <h3>📝 메모장</h3>
            <textarea
                placeholder="자유롭게 메모를 작성해보세요."
                value={memo}
                onChange={handleChange}
            />
        </div>
    );
}

export default MemoPad;
