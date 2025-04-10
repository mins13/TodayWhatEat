import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./SmallCalendar.css";

function SmallCalendar({ date, onDateChange }) {
    const handleMonthChange = ({ activeStartDate }) => {
        onDateChange(activeStartDate); // ✅ 이게 핵심!
    };

    return (
        <div className="small-calendar">
            <Calendar
                onChange={onDateChange}
                value={date}
                calendarType="gregory"
                locale="ko-KR"
                onActiveStartDateChange={handleMonthChange} // ✅ 추가
            />
        </div>
    );
}

export default SmallCalendar;
